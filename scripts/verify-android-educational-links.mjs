import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { connectAndroidWebView } from './android-webview.mjs';

const androidUser = execFileSync('adb', ['shell', 'am', 'get-current-user'], { encoding: 'utf8' }).trim();
if (!/^\d+$/.test(androidUser) || androidUser === '0') {
  throw new Error('Usa un perfil temporal de Android para conservar la sesión y los datos locales del usuario principal.');
}
execFileSync('adb', ['shell', 'settings', '--user', androidUser, 'put', 'system', 'screen_off_timeout', '1800000']);
execFileSync('adb', ['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);
execFileSync('adb', ['shell', 'wm', 'dismiss-keyguard']);
const prefix = 'android016_' + randomUUID().slice(0, 8);
const password = randomUUID() + '!aA1';
const accounts = [
  { role: 'padre_familia', name: 'Familia de prueba', username: prefix + '_padre' },
  { role: 'docente', name: 'Docente de prueba', username: prefix + '_docente' },
  { role: 'estudiante', name: 'Estudiante de vínculo', username: prefix + '_estudiante' },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let client;
for (let i = 0; i < 20; i++) {
  try { client = await connectAndroidWebView(); break; } catch { await sleep(500); }
}
if (!client) throw new Error('No se pudo conectar al WebView');
const page = 'Array.from(document.querySelectorAll("ion-router-outlet > .ion-page:not(.ion-page-hidden)")).at(-1) || document.body';
const text = async () => await client.evaluate('(' + page + ')?.innerText') ?? '';
const wait = async (predicate, label) => {
  for (let i = 0; i < 100; i++) { if (await predicate()) return; await sleep(400); }
  throw new Error('No se alcanzó: ' + label);
};
const click = async label => {
  await client.evaluate('(()=>{const button=Array.from((' + page + ').querySelectorAll("ion-button,button")).find(e=>e.textContent.trim()===' + JSON.stringify(label) + '&&!e.disabled);if(!button)throw new Error("Botón no disponible");button.click();})()');
  await sleep(400);
};
const input = async (label, value) => {
  await client.evaluate('(()=>{const el=Array.from((' + page + ').querySelectorAll("ion-input")).find(e=>e.label===' + JSON.stringify(label) + ');if(!el)throw new Error("Campo no disponible");el.value=' + JSON.stringify(value) + ';el.dispatchEvent(new CustomEvent("ionInput",{detail:{value:' + JSON.stringify(value) + '},bubbles:true}));})()');
};
const fillPassword = async () => client.evaluate('(()=>{const el=(' + page + ').querySelector("input[name=password]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,' + JSON.stringify(password) + ');el.dispatchEvent(new Event("input",{bubbles:true}));})()');
const submit = async () => { await client.evaluate('(' + page + ').querySelector("form").requestSubmit()'); await sleep(400); };
const screenshot = async name => {
  mkdirSync('docs/evidence/016-android', { recursive: true });
  const result = await client.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('docs/evidence/016-android/' + name + '.png', Buffer.from(result.data, 'base64'));
};
const logout = async () => {
  if ((await client.evaluate('location.pathname')) !== '/home') await click('Inicio');
  await wait(async () => (await text()).includes('Cerrar sesión'), 'inicio para salir');
  await click('Cerrar sesión');
  await wait(async () => (await text()).includes('Iniciar sesión'), 'salida');
};
const login = async account => {
  await input('Usuario', account.username);
  await fillPassword();
  await submit();
  await wait(async () => (await client.evaluate('location.pathname')) === '/home', 'login ' + account.role);
};

try {
  await wait(async () => /Iniciar sesión|Cerrar sesión|Ya tengo una cuenta/.test(await text()), 'pantalla inicial lista');
  if ((await client.evaluate('location.pathname')) === '/registro') await click('Ya tengo una cuenta');
  if ((await client.evaluate('location.pathname')) === '/home') await logout();
  await wait(async () => (await text()).includes('Iniciar sesión'), 'login inicial');
  for (const account of accounts) {
    await click('Crear una cuenta nueva');
    await input('Nombre', account.name);
    await input('Usuario', account.username);
    await input('Correo', account.username + '@example.test');
    await fillPassword();
    await client.evaluate('(()=>{const el=(' + page + ').querySelector("ion-select");el.value=' + JSON.stringify(account.role) + ';el.dispatchEvent(new CustomEvent("ionChange",{detail:{value:' + JSON.stringify(account.role) + '},bubbles:true}));})()');
    await screenshot('registro-' + account.role);
    await submit();
    await wait(async () => (await client.evaluate('location.pathname')) === '/home', 'registro ' + account.role);
    console.log('OK Android: registro de ' + account.role);
    if (account.role !== 'estudiante') {
      await wait(async () => (await text()).includes('No hay estudiantes asignados'), 'sin acceso inicial');
      await click('Vincular estudiantes');
      await wait(async () => (await text()).includes('Tu usuario es: ' + account.username), 'instrucciones de adulto');
      await screenshot('instrucciones-' + account.role);
      await logout();
    }
  }
  await click('Ver rutinas guardadas');
  await click('Crear rutina');
  await input('Título', 'Leer una página de mi libro');
  await submit();
  await wait(async () => (await text()).includes('La rutina se guardó correctamente.'), 'rutina estudiante');
  await click('Continuar');
  await click('Inicio');
  await wait(async () => (await text()).includes('Completar'), 'actividad');
  await click('Completar');
  await wait(async () => (await text()).includes('¡Un paso más, lo lograste!'), 'cumplimiento');
  await click('Cerrar celebración');
  await click('Mis acompañantes');
  for (const adult of accounts.slice(0, 2)) {
    await wait(async () => (await text()).includes('Buscar acompañante'), 'formulario de vínculo');
    await input('Usuario del adulto', adult.username);
    await submit();
    await wait(async () => (await text()).includes('Comprueba a quién autorizas'), 'identidad del adulto');
    assert.ok((await text()).includes(adult.name));
    await screenshot('confirmar-' + adult.role);
    await click('Autorizar acompañante');
    await wait(async () => (await text()).includes(adult.name + ' ya puede consultar'), 'vínculo confirmado');
  }
  await screenshot('acompanantes-vinculados');
  await logout();

  for (const adult of accounts.slice(0, 2)) {
    await login(adult);
    await wait(async () => (await text()).includes('Estudiante de vínculo'), 'estudiante asignado');
    await click('Ver progreso');
    await wait(async () => (await text()).includes('1 de 1 completadas'), 'reporte adulto');
    assert.ok((await text()).includes('Leer una página de mi libro'));
    const canComplete = await client.evaluate('Array.from((' + page + ').querySelectorAll("ion-button")).some(e=>["Completar","Desmarcar"].includes(e.textContent.trim()))');
    assert.equal(canComplete, false, 'El adulto no completa tareas');
    await screenshot('reporte-' + adult.role);
    console.log('OK Android: reporte de ' + adult.role);
    await click('Volver');
    await logout();
  }
  await login(accounts[2]);
  await click('Mis acompañantes');
  await wait(async () => (await text()).includes('Retirar acceso a Familia de prueba'), 'vínculo persistido');
  await click('Retirar acceso a Familia de prueba');
  await click('Conservar acceso');
  assert.ok((await text()).includes('Retirar acceso a Familia de prueba'));
  await click('Retirar acceso a Familia de prueba');
  await click('Confirmar retirada');
  await wait(async () => (await text()).includes('El acceso fue retirado.'), 'revocación');
  await screenshot('acceso-retirado');
  await logout();
  await login(accounts[0]);
  await wait(async () => (await text()).includes('No hay estudiantes asignados'), 'acceso revocado');
  await logout();
  console.log('OK Android: registro de tres perfiles, autorización de familia/docente, reportes reales y retirada de acceso.');
} catch (error) {
  await screenshot('fallo').catch(() => undefined);
  throw error;
} finally {
  client.close();
  const cleanup = 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{await p.user.deleteMany({where:{username:{in:' + JSON.stringify(accounts.map(account => account.username)) + '}}});await p.$disconnect();})().catch(()=>process.exit(1));';
  execFileSync('docker', ['exec', 'pasitos-backend', 'node', '-e', cleanup]);
  console.log('Cuentas temporales Android eliminadas.');
}
