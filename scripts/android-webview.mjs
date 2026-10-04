import { execFileSync } from 'node:child_process';

export const connectAndroidWebView = async () => {
  const pid = execFileSync('adb', ['shell', 'pidof', 'com.pasitosmagicos.app'], { encoding: 'utf8' }).trim();
  if (!/^\d+$/.test(pid)) throw new Error('La app no está abierta.');
  execFileSync('adb', ['forward', 'tcp:9224', 'localabstract:webview_devtools_remote_' + pid]);
  const pages = await (await fetch('http://127.0.0.1:9224/json/list')).json();
  const page = pages.find(item => item.type === 'page');
  if (!page) throw new Error('WebView no disponible.');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('CDP timeout: ' + method)); }, 30000);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + (result.exceptionDetails.exception?.description ?? ''));
    return result.result?.value;
  };
  return { send, evaluate, close: () => socket.close() };
};
