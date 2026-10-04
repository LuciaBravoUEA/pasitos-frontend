import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { connectAndroidWebView } from './android-webview.mjs';

const username = 'native014_' + randomUUID().slice(0, 8);
const password = randomUUID() + '!aA1';
const verifyRewards = process.argv.includes('--rewards');
const evidenceDirectory = verifyRewards ? 'docs/evidence/015-android' : 'docs/evidence/014-android';
let client = await connectAndroidWebView();
const page = 'Array.from(document.querySelectorAll("ion-router-outlet > .ion-page:not(.ion-page-hidden)")).at(-1) || document.body';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const text = async () => (await client.evaluate('(' + page + ').innerText')) ?? '';
const wait = async (predicate, label) => {
  for (let i = 0; i < 80; i++) { if (await predicate()) return; await sleep(500); }
  throw new Error('No se alcanzó: ' + label);
};
const click = async label => {
  await client.evaluate('(()=>{const root=' + page + ';const button=Array.from(root.querySelectorAll("ion-button,button")).find(e=>e.textContent.trim()===' + JSON.stringify(label) + '&&!e.disabled);if(!button)throw new Error("Botón no disponible: "+' + JSON.stringify(label) + ');button.click();})()');
  await sleep(500);
};
const ionInput = async (label, value, tag = 'ion-input') => client.evaluate('(()=>{const root=' + page + ';const el=Array.from(root.querySelectorAll(' + JSON.stringify(tag) + ')).find(e=>e.label===' + JSON.stringify(label) + ');if(!el)throw new Error("Campo no disponible");el.value=' + JSON.stringify(value) + ';el.dispatchEvent(new CustomEvent("ionInput",{detail:{value:' + JSON.stringify(value) + '},bubbles:true}));})()');
const submit = async (selector = 'form') => { await client.evaluate('(' + page + ').querySelector(' + JSON.stringify(selector) + ').requestSubmit()'); await sleep(500); };
const screenshot = async name => {
  mkdirSync(evidenceDirectory, { recursive: true });
  const result = await client.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(evidenceDirectory + '/' + name + '.png', Buffer.from(result.data, 'base64'));
};
try {
  if ((await client.evaluate('location.pathname')) === '/registro') await click('Ya tengo una cuenta');
  await wait(async () => (await text()).includes('Iniciar sesión') || (await text()).includes('Cerrar sesión'), 'arranque');
  if ((await client.evaluate('location.pathname')) === '/home') { await click('Cerrar sesión'); }
  await wait(async () => (await client.evaluate('location.pathname')) === '/login', 'login');
  await click('Crear una cuenta nueva');
  await ionInput('Nombre', 'Estudiante de prueba');
  await ionInput('Usuario', username);
  await ionInput('Correo', username + '@example.test');
  await client.evaluate('(()=>{const el=(' + page + ').querySelector("input[name=password]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,' + JSON.stringify(password) + ');el.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await submit();
  await wait(async () => (await client.evaluate('location.pathname')) === '/home', 'registro');
  await wait(async () => (await text()).includes('Comienza tu primera rutina'), 'inicio vacío');
  if (verifyRewards) await client.evaluate('(()=>{window.__rewardNotes=0;const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...args){window.__rewardNotes++;return start.apply(this,args);};})()');
  await click('Ver rutinas guardadas');
  await click('Crear rutina');
  await ionInput('Título', 'Mochila de prueba');
  await ionInput('Pasos de la rutina (uno por línea)', 'Revisar horario\nGuardar cuadernos', 'ion-textarea');
  await submit();
  await wait(async () => (await text()).includes('La rutina se guardó correctamente.'), 'crear rutina');
  await click('Continuar');
  await wait(async () => (await text()).includes('Revisar horario'), 'detalle con pasos');
  await click('Editar rutina');
  await ionInput('Título', 'Mochila editada');
  await submit('form[aria-label="Editar rutina"]');
  await wait(async () => (await text()).includes('Los cambios quedaron guardados.'), 'editar');
  await ionInput('Nueva tarea', 'Cerrar mochila');
  await submit('form[aria-label="Añadir tarea"]');
  await wait(async () => (await text()).includes('La tarea quedó guardada.'), 'añadir tarea');
  await screenshot('detalle-editado');
  await click('Inicio');
  await wait(async () => (await text()).includes('0 de 3 tareas completadas'), 'progreso inicial');
  for (const title of ['Revisar horario', 'Guardar cuadernos', 'Cerrar mochila']) {
    await client.evaluate('(()=>{const root=' + page + ';const card=Array.from(root.querySelectorAll("article")).find(e=>e.querySelector("h2,h3")?.textContent===' + JSON.stringify(title) + ');card.querySelector("ion-button").click();})()');
    await wait(async () => (await text()).includes('¡Buen trabajo! Tu avance quedó guardado.'), 'cumplimiento');
    if (verifyRewards) {
      assert.ok((await text()).includes('¡Un paso más, lo lograste!'));
      await screenshot('celebracion-inicio');
      await click('Cerrar celebración');
    }
    await sleep(500);
  }
  await wait(async () => (await text()).includes('3 de 3 tareas completadas'), 'progreso completo');
  await screenshot('inicio-completado');
  if (verifyRewards) {
    assert.equal(await client.evaluate('window.__rewardNotes'), 9, 'Tres notas por tarea confirmada');
    await click('Ver seguimiento');
    await wait(async () => (await text()).includes('Desmarcar'), 'seguimiento');
    await click('Desmarcar');
    await wait(async () => (await text()).includes('Completar'), 'desmarcado');
    assert.ok(!(await text()).includes('¡Un paso más, lo lograste!'));
    assert.equal(await client.evaluate('window.__rewardNotes'), 9);
    await click('Completar');
    await wait(async () => (await text()).includes('¡Un paso más, lo lograste!'), 'recompensa seguimiento');
    assert.equal(await client.evaluate('window.__rewardNotes'), 12);
    await screenshot('celebracion-seguimiento');
    await click('Cerrar celebración');
    await click('Silenciar celebraciones');
    await click('Desmarcar');
    await wait(async () => (await text()).includes('Completar'), 'desmarcado sin sonido');
    await click('Completar');
    await wait(async () => (await text()).includes('¡Un paso más, lo lograste!'), 'recompensa silenciosa');
    assert.equal(await client.evaluate('window.__rewardNotes'), 12, 'Silenciar conserva imagen sin audio');
    await click('Cerrar celebración');
    await click('Volver');
    await wait(async () => (await text()).includes('Activar sonido de celebraciones'), 'preferencia compartida');
  }
  console.log('OK Android: registro, creación con pasos, edición, alta de tarea y cumplimiento desde la interfaz.');
  client.close();
  execFileSync('adb', ['shell', 'am', 'force-stop', 'com.pasitosmagicos.app']);
  execFileSync('adb', ['shell', 'monkey', '-p', 'com.pasitosmagicos.app', '-c', 'android.intent.category.LAUNCHER', '1']);
  await sleep(3000);
  client = await connectAndroidWebView();
  await wait(async () => (await text()).includes('3 de 3 tareas completadas'), 'reapertura persistente');
  await screenshot('reapertura-persistente');
  if (verifyRewards) {
    assert.ok((await text()).includes('Activar sonido de celebraciones'), 'Silencio persistido tras reinicio');
    assert.ok(!(await text()).includes('¡Un paso más, lo lograste!'), 'Sin celebración al cargar');
    await click('Activar sonido de celebraciones');
    console.log('OK Android: recompensas visuales/audio en ambas pantallas, desmarcado sin premio y silencio persistente.');
  }
  await click('Ver rutinas guardadas');
  await wait(async () => (await text()).includes('Mochila editada'), 'listado persistente');
  await click('Ver detalle');
  await wait(async () => (await text()).includes('Eliminar rutina'), 'detalle');
  await click('Eliminar rutina');
  await click('Conservar rutina');
  assert.ok((await text()).includes('Mochila editada'));
  await click('Eliminar rutina');
  await click('Confirmar eliminación');
  await wait(async () => (await text()).includes('La rutina se eliminó correctamente.'), 'eliminación');
  await screenshot('rutina-eliminada');
  await click('Inicio');
  await click('Cerrar sesión');
  await wait(async () => (await client.evaluate('location.pathname')) === '/login', 'logout');
  console.log('OK Android: sesión/progreso tras cerrar y reabrir, cancelar eliminación, eliminar y logout.');
} catch (error) {
  await screenshot('fallo').catch(() => undefined);
  throw error;
} finally {
  client.close();
  const cleanup = 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{await p.user.deleteMany({where:{username:' + JSON.stringify(username) + '}});await p.$disconnect();})().catch(()=>process.exit(1));';
  execFileSync('docker', ['exec', 'pasitos-backend', 'node', '-e', cleanup]);
  console.log('Cuenta temporal Android eliminada.');
}
