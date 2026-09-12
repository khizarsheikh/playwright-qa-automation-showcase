const url = new URL('/api/health', process.env.BASE_URL || 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BASE_URL must use HTTP or HTTPS');
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    const health = await response.json();
    if (response.ok && health.app === 'tasklane' && health.status === 'ok') { ready = true; break; }
  } catch { /* Container may still be starting. */ }
  await new Promise(resolve => setTimeout(resolve, 1_000));
}
if (!ready) throw new Error('Tasklane did not become ready within the readiness window');
console.log('Tasklane is ready');
