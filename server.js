const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const ALLOW = [
  'api.anthropic.com', 'api.openai.com', 'api.deepseek.com',
  'api.moonshot.cn', 'dashscope.aliyuncs.com', 'open.bigmodel.cn',
  'api.siliconflow.cn', 'api.mistral.ai', 'api.groq.com', 'generativelanguage.googleapis.com'
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

app.use(express.raw({ type: '*/*', limit: '20mb' }));

app.all('/', async (req, res) => {
  res.set(CORS);
  if (req.method === 'OPTIONS') return res.status(204).end();

  let target;
  try { target = new URL(req.query.url); }
  catch (e) { return res.status(400).send('bad url'); }
  if (target.protocol !== 'https:' || !ALLOW.includes(target.hostname)) {
    return res.status(403).send('host not allowed');
  }

  const headers = {};
  for (const k of ['authorization', 'content-type', 'x-api-key', 'anthropic-version', 'anthropic-dangerous-direct-browser-access']) {
    if (req.headers[k]) headers[k] = req.headers[k];
  }

  try {
    const r = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : req.body
    });
    res.status(r.status);
    res.set('Content-Type', r.headers.get('content-type') || 'application/json');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(502).send('upstream error: ' + e.message);
  }
});

app.listen(PORT, () => console.log('proxy on ' + PORT));
