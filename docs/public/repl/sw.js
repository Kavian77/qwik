/* eslint-disable no-console */

const update = async (version, options) => {
  console.time('Update');

  const result = {
    type: 'result',
    outputHtml: '',
    clientModules: [],
    ssrModules: [],
    diagnostics: [],
    docElementAttributes: {},
    headAttributes: {},
    bodyAttributes: {},
    bodyInnerHtml: '',
    qwikloader: '',
    symbolsEntryMap: null,
    transformedModuleOutput: {},
  };

  try {
    await loadDependencies(version, options);

    await bundleClient(options, result);
    await bundleSSR(options, result);

    await renderHtml(result);

    ctx.clientModules = result.clientModules;
  } catch (e) {
    result.diagnostics.push({
      message: String(e),
      severity: 'Error',
    });
    console.error(e);
  }

  await sendMessageToIframe(result);

  console.timeEnd('Update');
};

const bundleClient = async (options, result) => {
  console.time(`Bundle client`);

  const qwikRollupPluginOpts = {
    buildMode: 'client',
    isDevBuild: true,
    debug: options.debug,
    srcInputs: options.srcInputs,
    entryStrategy: options.entryStrategy,
    minify: options.minify,
    sourceMaps: false,
    forceFullBuild: true,
    symbolsOutput: (s) => {
      result.symbolsEntryMap = s;
    },
    transformedModuleOutput: (t) => {
      result.transformedModuleOutput = t;
    },
  };

  const rollupInputOpts = {
    input: '/app.tsx',
    cache: ctx.rollupCache,
    plugins: [
      self.qwikOptimizer.qwikRollup(qwikRollupPluginOpts),
      replResolver(options, 'client'),
      replTerser(qwikRollupPluginOpts),
    ],
    onwarn(warning) {
      result.diagnostics.push({ message: warning.message });
    },
  };

  const bundle = await self.rollup.rollup(rollupInputOpts);

  ctx.rollupCache = bundle.cache;

  const generated = await bundle.generate({});

  result.clientModules = generated.output.map(getOutput).filter((f) => {
    return !f.path.endsWith('app.js') && !f.path.endsWith('symbols-manifest.json');
  });

  console.timeEnd(`Bundle client`);
};

const bundleSSR = async (options, result) => {
  console.time(`Bundle ssr`);

  const qwikRollupPluginOpts = {
    buildMode: 'ssr',
    isDevBuild: true,
    debug: options.debug,
    srcInputs: options.srcInputs,
    entryStrategy: { type: 'single'},
    minify: options.minify,
    sourceMaps: false,
    symbolsInput: result.symbolsEntryMap,
  };

  const rollupInputOpts = {
    input: '/entry.server.tsx',
    cache: ctx.rollupCache,
    plugins: [self.qwikOptimizer.qwikRollup(qwikRollupPluginOpts), replResolver(options, 'ssr')],
    onwarn(warning) {
      result.diagnostics.push({ message: warning.message });
    },
  };

  const bundle = await self.rollup.rollup(rollupInputOpts);

  ctx.rollupCache = bundle.cache;

  const generated = await bundle.generate({
    inlineDynamicImports: true,
  });

  result.ssrModules = generated.output.map(getOutput);

  console.timeEnd(`Bundle ssr`);
};

const getOutput = (o) => {
  const f = {
    path: o.fileName,
    code: '',
    isEntry: o.isDynamicEntry,
  };
  if (o.type === 'chunk') {
    f.code = o.code || '';
    f.isEntry = o.isDynamicEntry;
  } else if (o.type === 'asset') {
    f.code = o.source || '';
    f.isEntry = false;
  }
  f.size = `${f.code.length} B`;
  return f;
};

const replTerser = (qwikRollupPluginOpts) => {
  if (qwikRollupPluginOpts.minify !== 'minify') {
    return {};
  }

  return {
    name: 'repl-terser',
    async generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          const result = await self.Terser.minify(chunk.code, TERSER_OPTIONS);
          chunk.code = result.code;
        }
      }
    },
  };
};

const TERSER_OPTIONS = {
  ecma: 2020,
  module: true,
  toplevel: true,
};

const replResolver = (options, buildMode) => {
  return {
    name: 'repl-resolver',
    resolveId(id, importer) {
      if (!importer) {
        return id;
      }
      if (id === '@builder.io/qwik' || id === '@builder.io/qwik/jsx-runtime') {
        return '\0qwikCore';
      }
      if (id === '@builder.io/qwik/server') {
        return '\0qwikServer';
      }
      return {
        id,
        external: true,
      };
    },
    load(id) {
      const input = options.srcInputs.find((i) => i.path === id);
      if (input) {
        return input;
      }
      if (buildMode === 'ssr') {
        if (id === '\0qwikCore') {
          return getRuntimeBundle('qwikCore');
        }
        if (id === '\0qwikServer') {
          return getRuntimeBundle('qwikServer');
        }
      }
      if (id === '\0qwikCore') {
        return ctx.coreEsmCode;
      }
      return null;
    },
  };
};

const renderHtml = async (result) => {
  console.time(`SSR Html`);

  const ssrModule = result.ssrModules.find((m) => m.path.endsWith('.js'));
  if (!ssrModule) {
    return;
  }

  const module = { exports: {} };
  const runModule = new Function('module', 'exports', ssrModule.code);
  runModule(module, module.exports);

  const server = module.exports;

  const ssrResult = await server.render({
    base: '/repl/',
    symbols: result.symbolsEntryMap,
  });

  const doc = self.qwikServer.createDocument({ html: ssrResult.html });
  const qwikLoader = doc.getElementById('qwikloader');
  if (qwikLoader) {
    qwikLoader.remove();
    result.qwikloader = qwikLoader.innerHTML;
  }

  getAttributes(doc.documentElement, result.docElementAttributes);
  getAttributes(doc.head, result.headAttributes);
  getAttributes(doc.body, result.bodyAttributes);
  result.bodyInnerHtml = doc.body.innerHTML;

  result.appHtml = doc.outerHTML;

  result.outputHtml = self.prettier.format(ssrResult.html, {
    parser: 'html',
    plugins: self.prettierPlugins,
  });

  console.timeEnd(`SSR Html`);
};

const getAttributes = (elm, attrs) => {
  for (let i = 0; i < elm.attributes.length; i++) {
    attrs[elm.attributes[i].nodeName] = elm.attributes[i].nodeValue;
  }
};

const receiveMessageFromIframe = (ev) => {
  if (ev.data.type === 'update') {
    update(ev.data.version, ev.data.options);
  }
};

const sendMessageToIframe = async (msg) => {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage(msg));
};

const loadDependencies = async (version, options) => {
  if (
    !self.qwikCore ||
    !self.qwikOptimizer ||
    !self.qwikServer ||
    !self.rollup ||
    self.qwikCore.version !== version ||
    self.qwikOptimizer.versions.qwik !== version ||
    self.qwikServer.versions.qwik !== version ||
    self.rollup.VERSION !== rollupVersion
  ) {
    console.time('Load dependencies');
    self.qwikCore = self.qwikOptimizer = self.qwikServer = self.rollup = null;

    const coreCjsUrl = `/repl/core.cjs`;
    const coreEsmUrl = `/repl/core.mjs`;
    const optimizerCjsUrl = `/repl/optimizer.cjs`;
    const serverCjsUrl = `/repl/server.cjs`;
    const rollupUrl = getNpmCdnUrl('rollup', rollupVersion, '/dist/rollup.browser.js');
    const prettierUrl = getNpmCdnUrl('prettier', prettierVersion, '/standalone.js');
    const prettierHtmlUrl = getNpmCdnUrl('prettier', prettierVersion, '/parser-html.js');

    const depUrls = [
      coreCjsUrl,
      coreEsmUrl,
      optimizerCjsUrl,
      serverCjsUrl,
      rollupUrl,
      prettierUrl,
      prettierHtmlUrl,
    ];

    const rsps = await Promise.all(depUrls.map((u) => fetch(u)));

    rsps.forEach((rsp) => {
      if (!rsp.ok) {
        throw new Error(`Unable to load dependency: ${rsp.url}`);
      }
    });

    const [
      coreCjsCode,
      coreEsmCode,
      optimizerCjsCode,
      serverCjsCode,
      rollupCode,
      prettierCode,
      prettierHtmlCode,
    ] = await Promise.all(rsps.map((rsp) => rsp.text()));

    ctx.coreEsmCode = coreEsmCode;

    const coreApply = new Function(coreCjsCode);
    const optimizerApply = new Function(optimizerCjsCode);
    const serverApply = new Function(serverCjsCode);
    const rollupApply = new Function(rollupCode);
    const prettierApply = new Function(prettierCode);
    const prettierHtmlApply = new Function(prettierHtmlCode);

    coreApply();
    console.debug(`Loaded @builder.io/qwik: ${self.qwikCore.version}`);
    optimizerApply();
    console.debug(`Loaded @builder.io/qwik/optimizer: ${self.qwikOptimizer.versions.qwik}`);
    serverApply();
    console.debug(`Loaded @builder.io/qwik/server: ${self.qwikServer.versions.qwik}`);
    rollupApply();
    console.debug(`Loaded rollup: ${self.rollup.VERSION}`);
    prettierApply();
    prettierHtmlApply();
    console.debug(`Loaded prettier: ${self.prettier.version}`);

    console.timeEnd('Load dependencies');
  }

  if (options.minify === 'minify' && !self.Terser) {
    console.time(`Load terser ${terserVersion}`);
    const terserUrl = getNpmCdnUrl('terser', terserVersion, '/dist/bundle.min.js');
    const terserRsp = await fetch(terserUrl);
    const terserCode = await terserRsp.text();
    const terserApply = new Function(terserCode);
    terserApply();
    console.timeEnd(`Load terser ${terserVersion}`);
  }
};

const onIframeRequest = (ev) => {
  const reqUrl = new URL(ev.request.url);
  const pathname = reqUrl.pathname;

  if (Array.isArray(ctx.clientModules)) {
    const clientModule = ctx.clientModules.find((m) => {
      const moduleUrl = new URL('./' + m.path, reqUrl);
      return pathname === moduleUrl.pathname;
    });

    if (clientModule) {
      return ev.respondWith(
        new Response(clientModule.code, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Qwik-Playground': self.qwikCore.version,
          },
        })
      );
    }
  }
};

const ctx = {};

const rollupVersion = '2.70.2';
const prettierVersion = '2.6.2';
const terserVersion = '5.12.1';

const getNpmCdnUrl = (pkgName, pkgVersion, pkgPath) =>
  new URL(`https://cdn.jsdelivr.net/npm/${pkgName}${pkgVersion ? '@' + pkgVersion : ''}${pkgPath}`);

const getRuntimeBundle = (runtimeBundle) => {
  const exportKeys = Object.keys(self[runtimeBundle]);
  const code = `
    const { ${exportKeys.join(', ')} } = self.${runtimeBundle};
    export { ${exportKeys.join(', ')} };
  `;
  return code;
};

self.onmessage = receiveMessageFromIframe;
self.onfetch = onIframeRequest;
self.oninstall = () => self.skipWaiting();
self.onactivate = () => self.clients.claim();
