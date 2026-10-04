import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const base = 'http://localhost:3001/api';
const prefix = 'verify014_' + randomUUID().slice(0, 8);
const accounts = [];
const request = async (path, token, method = 'GET', body, status = 200) => {
  const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, status, method + ' ' + path);
  return response.status === 204 ? null : response.json();
};
const db = code => JSON.parse(execFileSync('docker', ['exec', 'pasitos-backend', 'node', '-e', 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{try{const result=await (async()=>{' + code + '})();console.log(JSON.stringify(result));}finally{await p.$disconnect();}})().catch(()=>process.exit(1));'], { encoding: 'utf8' }).trim());
try {
  for (let i = 0; i < 4; i++) {
    const username = prefix + '_' + i;
    const password = randomUUID() + '!aA1';
    const registered = await request('/auth/mobile/register', null, 'POST', { name: 'Verificación temporal', username, email: username + '@example.test', password }, 201);
    const token = registered.data.sessionToken;
    const session = await request('/auth/session', token);
    accounts.push({ id: session.data.id, token, username, password });
  }
  const [student, other, parent, teacher] = accounts;
  db('await p.user.update({where:{id:' + JSON.stringify(parent.id) + '},data:{role_code:"padre_familia",role_name:"Padre"}}); await p.user.update({where:{id:' + JSON.stringify(teacher.id) + '},data:{role_code:"docente",role_name:"Docente"}}); await p.studentGuardian.create({data:{studentId:' + JSON.stringify(student.id) + ',guardianId:' + JSON.stringify(parent.id) + '}}); await p.studentTeacher.create({data:{studentId:' + JSON.stringify(student.id) + ',teacherId:' + JSON.stringify(teacher.id) + '}}); return true;');
  const input = { title: 'Rutina de verificación', description: 'Dato temporal', category: 'HOGAR', points: 20, tasks: ['Preparar mochila', 'Leer un cuento'] };
  await request('/rutinas', null, 'POST', input, 401);
  await request('/rutinas', student.token, 'POST', { ...input, tasks: ['x'] }, 422);
  const created = (await request('/rutinas', student.token, 'POST', input, 201)).data;
  const id = created.id;
  let detail = (await request('/rutinas/' + id, student.token)).data;
  assert.equal(detail.tasks.length, 2);
  await request('/rutinas/' + id, other.token, 'GET', undefined, 404);
  await request('/rutinas/' + id, other.token, 'PUT', input, 404);
  await request('/rutinas/' + id, other.token, 'DELETE', undefined, 404);
  await request('/rutinas/' + id + '/tareas', other.token, 'POST', { title: 'Ajena' }, 404);
  await request('/rutinas/' + id, student.token, 'PUT', { ...input, title: '' }, 422);
  const updated = (await request('/rutinas/' + id, student.token, 'PUT', { ...input, title: 'Rutina editada' })).data;
  assert.deepEqual(updated.tasks.map(task => task.id), detail.tasks.map(task => task.id));
  const extra = (await request('/rutinas/' + id + '/tareas', student.token, 'POST', { title: 'Ordenar útiles' }, 201)).data;
  detail = (await request('/rutinas/' + id, student.token)).data;
  assert.equal(detail.tasks.length, 3);
  const date = '2026-10-01';
  for (const task of detail.tasks) await request('/tareas/' + task.id + '/completar', student.token, 'POST', { completed: true, date });
  await request('/tareas/' + extra.id + '/completar', student.token, 'POST', { completed: true, date });
  await request('/tareas/' + extra.id + '/completar', other.token, 'POST', { completed: true, date }, 403);
  await request('/tareas/' + extra.id + '/completar', parent.token, 'POST', { completed: false, date }, 403);
  const progress = (await request('/estudiantes/' + student.id + '/progreso?date=' + date, student.token)).data;
  assert.equal(progress.totals.completed, 3);
  assert.equal(progress.totals.stars, 20);
  for (const adult of [parent, teacher]) {
    const list = await request('/estudiantes/asignados?date=' + date, adult.token);
    assert.equal(list.data.length, 1);
    assert.equal(list.data[0].progressPercent, 100);
    const shared = await request('/estudiantes/' + student.id + '/progreso?date=' + date, adult.token);
    assert.equal(shared.data.totals.completed, 3);
    await request('/estudiantes/' + other.id + '/progreso?date=' + date, adult.token, 'GET', undefined, 403);
  }
  const saved = db('return {routine:await p.routine.findUnique({where:{id:' + JSON.stringify(id) + '},select:{title:true}}), completions:await p.taskCompletion.count({where:{studentId:' + JSON.stringify(student.id) + '}})};');
  assert.equal(saved.routine.title, 'Rutina editada');
  assert.equal(saved.completions, 3);
  console.log('OK: registro, CRUD, validaciones, tareas, estrellas, roles y PostgreSQL.');
  execFileSync('docker', ['restart', 'pasitos-backend'], { stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + '/health', { signal: AbortSignal.timeout(3000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Backend no reinició');
  const after = (await request('/rutinas/' + id, student.token)).data;
  assert.equal(after.title, 'Rutina editada');
  assert.equal(after.tasks.length, 3);
  assert.equal((await request('/estudiantes/' + student.id + '/progreso?date=' + date, student.token)).data.totals.completed, 3);
  await request('/auth/mobile/login', null, 'POST', { username: student.username, password: student.password });
  console.log('OK: cuenta, sesión, rutina y cumplimientos sobreviven al reinicio del backend.');
  await request('/tareas/' + extra.id + '/completar', student.token, 'POST', { completed: false, date });
  assert.equal((await request('/estudiantes/' + student.id + '/progreso?date=' + date, student.token)).data.totals.stars, 0);
  await request('/rutinas/' + id, student.token, 'DELETE', undefined, 204);
  await request('/rutinas/' + id, student.token, 'GET', undefined, 404);
  assert.equal(db('return await p.taskCompletion.count({where:{studentId:' + JSON.stringify(student.id) + '}});'), 0);
  await request('/auth/logout', student.token, 'POST', undefined, 204);
  await request('/auth/session', student.token, 'GET', undefined, 401);
  console.log('OK: desmarcar, eliminación en cascada y logout.');
} finally {
  db('return await p.user.deleteMany({where:{username:{startsWith:' + JSON.stringify(prefix + '_') + '}}});');
  console.log('Cuentas temporales eliminadas; datos existentes conservados.');
}
