import http from 'node:http';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Purpose-built, ephemeral test target. Not a production account service.
const users = new Map();
const sessions = new Map();
const tasks = new Map();
const assets = new Map(await Promise.all([
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/client.js', 'client.js', 'text/javascript; charset=utf-8'],
  ['/style.css', 'style.css', 'text/css; charset=utf-8']
].map(async ([path, file, type]) => [path, { content: await readFile(new URL(file, import.meta.url)), type }])));
const hash = (password, salt) => scryptSync(password, salt, 32);
const validTitle = title => typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 120;
const publicTask = ({ owner, ...task }) => task;
function reply(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
}
async function readBody(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 16_384) throw new Error('Body too large');
  }
  const value = JSON.parse(text || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Object required');
  return value;
}
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const method = req.method;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
    if (method === 'GET' && assets.has(path)) {
      const asset = assets.get(path);
      res.writeHead(200, { 'Content-Type': asset.type, 'Cache-Control': 'no-store' });
      return res.end(asset.content);
    }
    if (path === '/api/health' && method === 'GET') return reply(res, 200, { status: 'ok', app: 'tasklane' });
    if (path === '/api/register' && method === 'POST') {
      const { email, password } = await readBody(req);
      if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || password.length > 128) return reply(res, 400, { error: 'Enter a valid email and a password of 8–128 characters.' });
      const normalized = email.trim().toLowerCase();
      if (users.has(normalized)) return reply(res, 409, { error: 'Account already exists.' });
      const salt = randomUUID();
      users.set(normalized, { salt, hash: hash(password, salt) });
      return reply(res, 201, { email: normalized });
    }
    if (path === '/api/login' && method === 'POST') {
      const { email, password } = await readBody(req);
      const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const user = users.get(normalized);
      if (!user || typeof password !== 'string' || password.length > 128 || !timingSafeEqual(user.hash, hash(password, user.salt))) return reply(res, 401, { error: 'Invalid email or password.' });
      const token = randomUUID();
      sessions.set(token, normalized);
      return reply(res, 200, { email: normalized }, { 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Strict; Path=/${process.env.SECURE_COOKIES === 'true' ? '; Secure' : ''}` });
    }
    const token = /(?:^|;\s*)session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
    const email = sessions.get(token);
    if (!email) return reply(res, 401, { error: 'Authentication required.' });
    if (path === '/api/me' && method === 'GET') return reply(res, 200, { email });
    if (path === '/api/logout' && method === 'POST') {
      sessions.delete(token);
      return reply(res, 200, { ok: true }, { 'Set-Cookie': 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (path === '/api/account' && method === 'DELETE') {
      users.delete(email);
      for (const [id, task] of tasks) if (task.owner === email) tasks.delete(id);
      for (const [id, owner] of sessions) if (owner === email) sessions.delete(id);
      return reply(res, 200, { ok: true });
    }
    if (path === '/api/tasks' && method === 'GET') return reply(res, 200, { tasks: [...tasks.values()].filter(t => t.owner === email).map(publicTask) });
    if (path === '/api/tasks' && method === 'POST') {
      const { title } = await readBody(req);
      if (!validTitle(title)) return reply(res, 400, { error: 'Title must contain 1–120 characters.' });
      const task = { id: randomUUID(), title: title.trim(), done: false, owner: email };
      tasks.set(task.id, task);
      return reply(res, 201, publicTask(task));
    }
    const match = /^\/api\/tasks\/([^/]+)$/.exec(path);
    if (match && ['PATCH', 'DELETE'].includes(method)) {
      const task = tasks.get(match[1]);
      if (!task || task.owner !== email) return reply(res, 404, { error: 'Task not found.' });
      if (method === 'DELETE') { tasks.delete(task.id); return reply(res, 200, { ok: true }); }
      const data = await readBody(req);
      if ('title' in data && !validTitle(data.title)) return reply(res, 400, { error: 'Title must contain 1–120 characters.' });
      if ('done' in data && typeof data.done !== 'boolean') return reply(res, 400, { error: 'Done must be a boolean.' });
      if ('title' in data) task.title = data.title.trim();
      if ('done' in data) task.done = data.done;
      return reply(res, 200, publicTask(task));
    }
    return reply(res, 404, { error: 'Not found.' });
  } catch {
    return reply(res, 400, { error: 'Invalid request body.' });
  }
});
export async function startServer(port = Number(process.env.PORT || 3000), host = '0.0.0.0') {
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => { server.removeListener('error', reject); done(); });
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startServer();
  console.log(`Tasklane listening on port ${process.env.PORT || 3000}`);
}
