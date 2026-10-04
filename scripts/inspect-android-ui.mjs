import { connectAndroidWebView } from './android-webview.mjs';
const client = await connectAndroidWebView();
try {
  console.log(JSON.stringify(await client.evaluate('({path:location.pathname,text:document.body.innerText.slice(0,3000),html:document.querySelector("#root")?.innerHTML.slice(0,1500)})')));
} finally { client.close(); }
