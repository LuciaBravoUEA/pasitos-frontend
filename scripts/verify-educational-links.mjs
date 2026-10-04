import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const prefix = 'links016_' + randomUUID().slice(0, 8);
const usernames = [];
const base = 'http://localhost:3001/api';
const request = async (path, token, method = 'GET', body, expected = 200) => {
  const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, expected, method + ' ' + path);
  return response.status === 204 ? null : response.json();
};
const db = code => JSON.parse(execFileSync('docker', ['exec', 'pasitos-backend', 'node', '-e', 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{try{const result=await(async()=>{' + code + '})();console.log(JSON.stringify(result));}finally{await p.$disconnect();}})().catch(()=>process.exit(1));'], { encoding: 'utf8' }).trim());
try {
  const accounts = [];
  for (const [index, role] of [undefined, 'estudiante', 'padre_familia', 'docente'].entries()) {
    const username = prefix + '_' + index;
    usernames.push(username);
    const password = randomUUID() + '!aA1';
    const { data } = await request('/auth/mobile/register', null, 'POST', { name: 'Prueba de vínculo', username, email: username + '@example.test', password, ...(role ? { role } : {}) }, 201);
    const { data: session } = await request('/auth/session', data.sessionToken);
    assert.equal(session.roles[0].code, role ?? 'estudiante');
    accounts.push({ id: session.id, token: data.sessionToken, username });
  }
  const [student, other, parent, teacher] = accounts;
  await request('/auth/mobile/register', null, 'POST', { role: 'admin' }, 422);
  await request('/auth/mobile/register', null, 'POST', { role: '__proto__' }, 422);
  await request('/acompanantes', null, 'GET', undefined, 401);
  await request('/acompanantes', student.token, 'POST', { adultId: 'invalid' }, 422);
  await request('/acompanantes/buscar', student.token, 'POST', { username: '' }, 422);
  await request('/acompanantes/buscar', student.token, 'POST', { username: 'x'.repeat(101) }, 422);
  await request('/acompanantes/buscar', student.token, 'POST', { username: student.username }, 404);
  await request('/acompanantes/buscar', student.token, 'POST', { username: prefix + '_absent' }, 404);
  await request('/acompanantes', student.token, 'POST', { adultId: student.id }, 404);

  const { data: routine } = await request('/rutinas', student.token, 'POST', { title: 'Leer un cuento', category: 'ESCUELA', points: 10, tasks: ['Leer una página'] }, 201);
  const { data: detail } = await request('/rutinas/' + routine.id, student.token);
  const taskId = detail.tasks[0].id;
  const date = '2026-10-01';
  await request('/tareas/' + taskId + '/completar', student.token, 'POST', { completed: true, date });

  for (const adult of [parent, teacher]) {
    assert.equal((await request('/acompanantes', adult.token)).data.username, adult.username);
    assert.deepEqual((await request('/estudiantes/asignados', adult.token)).data, []);
    await request('/estudiantes/' + student.id + '/progreso', adult.token, 'GET', undefined, 403);
    await request('/acompanantes/buscar', adult.token, 'POST', { username: parent.username }, 403);
    await request('/acompanantes', adult.token, 'POST', { adultId: adult.id, studentId: student.id }, 403);
    await request('/acompanantes/' + adult.id, adult.token, 'DELETE', undefined, 403);
    const candidate = (await request('/acompanantes/buscar', student.token, 'POST', { username: ' ' + adult.username.toUpperCase() + ' ' })).data;
    assert.equal(candidate.id, adult.id);
    assert.equal(candidate.email, undefined);
    await Promise.all([request('/acompanantes', student.token, 'POST', { adultId: adult.id }), request('/acompanantes', student.token, 'POST', { adultId: adult.id })]);
    const summaries = (await request('/estudiantes/asignados?date=' + date, adult.token)).data;
    assert.deepEqual(summaries.map(row => row.id), [student.id]);
    const progress = (await request('/estudiantes/' + student.id + '/progreso?date=' + date, adult.token)).data;
    assert.equal(progress.totals.completed, 1);
    assert.equal(progress.totals.stars, 10);
    await request('/estudiantes/' + other.id + '/progreso', adult.token, 'GET', undefined, 403);
    await request('/tareas/' + taskId + '/completar', adult.token, 'POST', { completed: false, date }, 403);
  }
  assert.equal((await request('/acompanantes', student.token)).data.companions.length, 2);
  await request('/acompanantes/' + parent.id, other.token, 'DELETE', undefined, 204);
  assert.equal((await request('/acompanantes', student.token)).data.companions.length, 2);
  assert.deepEqual(db('return [await p.studentGuardian.count({where:{studentId:' + JSON.stringify(student.id) + '}}), await p.studentTeacher.count({where:{studentId:' + JSON.stringify(student.id) + '}})];'), [1, 1]);
  console.log('OK API: tres perfiles, whitelist, consentimiento, idempotencia, aislamiento y solo lectura de adultos.');

  execFileSync('docker', ['restart', 'pasitos-backend'], { stdio: 'pipe' });
  let ready = false;
  for (let i = 0; i < 45; i++) {
    try { if ((await fetch(base + '/auth/session', { headers: { Authorization: 'Bearer ' + student.token }, signal: AbortSignal.timeout(3000) })).ok) { ready = true; break; } } catch { /* Arranque del contenedor. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Backend reiniciado');
  assert.equal((await request('/acompanantes', student.token)).data.companions.length, 2);
  for (const adult of [parent, teacher]) {
    assert.equal((await request('/estudiantes/' + student.id + '/progreso?date=' + date, adult.token)).data.totals.completed, 1);
    await request('/acompanantes/' + adult.id, student.token, 'DELETE', undefined, 204);
    await request('/estudiantes/' + student.id + '/progreso', adult.token, 'GET', undefined, 403);
    assert.deepEqual((await request('/estudiantes/asignados', adult.token)).data, []);
  }
  assert.equal((await request('/acompanantes', student.token)).data.companions.length, 0);
  assert.equal((await request('/estudiantes/' + student.id + '/progreso?date=' + date, student.token)).data.totals.completed, 1);
  console.log('OK API/BD: vínculos y sesiones persisten tras reinicio; revocar retira acceso sin borrar actividades.');
} finally {
  db('return p.user.deleteMany({where:{username:{in:' + JSON.stringify(usernames) + '}}});');
  console.log('Cuentas temporales de vínculos eliminadas.');
}
