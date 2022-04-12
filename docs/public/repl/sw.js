self.result = null;
self.iframeLocation = '';

const update = async (version, options) => {
  await loadQwikModules(version);

  const optimizer = await self.qwikOptimizer.createOptimizer();
  self.result = await optimizer.transformModules(options);

  sendMessageToIframe({
    type: 'result',
    result: self.result,
    html: `<html>
      <head>
      </head>
      <body style="color:red">fu</body>
    </html>`,
  });
};

const receiveMessageFromIframe = (ev) => {
  const evData = ev.data;
  const evType = evData && evData.type;
  if (evData && evData.location) {
    self.iframeLocation = evData.location;
  }
  if (evType === 'update') {
    update(evData.version, evData.options);
  }
};

const sendMessageToIframe = async (msg) => {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage(msg));
};

const loadQwikModules = async (version) => {
  if (
    !self.qwikCore ||
    !self.qwikOptimizer ||
    !self.qwikServer ||
    self.qwikCore.version !== version ||
    self.qwikOptimizer.versions.qwik !== version ||
    self.qwikServer.versions.qwik !== version
  ) {
    self.qwikCore = self.qwikOptimizer = self.qwikServer = null;

    // https://cdn.jsdelivr.net/npm/@builder.io/qwik@${version}/optimizer.cjs
    const coreUrl = `/repl/core.cjs`;
    const optimizerUrl = `/repl/optimizer.cjs`;
    const serverUrl = `/repl/server.cjs`;

    // cannot use importScripts() at this point in a service worker (too late)
    const [coreRsp, optimizerRsp, serverRsp] = await Promise.all([
      fetch(coreUrl),
      fetch(optimizerUrl),
      fetch(serverUrl),
    ]);
    const [coreCode, optimizerCode, serverCode] = await Promise.all([
      coreRsp.text(),
      optimizerRsp.text(),
      serverRsp.text(),
    ]);

    const evalCore = new Function(coreCode);
    const evalOptimizer = new Function(optimizerCode);
    const evalServer = new Function(serverCode);

    evalCore();
    evalOptimizer();
    evalServer();

    console.debug(`Loaded @builder.io/qwik ${self.qwikCore.version}`);
  }
};

self.onfetch = async (ev) => {
  const reqUrl = new URL(ev.request.url);
  const pathname = reqUrl.pathname;

  const modules = self.result && self.result.modules;
  if (Array.isArray(modules)) {
    const module = modules.find((m) => {
      const moduleUrl = new URL('./' + m.path, reqUrl);
      return pathname === moduleUrl.pathname;
    });
    if (module) { 
      return ev.respondWith(new Response(module.code, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-QWIK-REPL': self.qwikCore.version
        },
      }));
    }
  }
};

self.onmessage = receiveMessageFromIframe;

self.oninstall = () => self.skipWaiting();

self.onactivate = () => self.clients.claim();
