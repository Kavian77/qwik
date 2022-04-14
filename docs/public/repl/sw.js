/* eslint-disable no-console */

const update = async (version, options) => {
  console.time('Update');

  const result = {
    type: 'result',
    outputHtml: '',
    clientModules: [],
    serverModules: [],
    diagnostics: [],
    docElementAttributes: {},
    headAttributes: {},
    headElements: [],
    bodyAttributes: {},
    bodyInnerHtml: '',
  };

  try {
    await loadDependencies(version, options);

    result.clientModules = await bundleApp(options, result.diagnostics, '/main.tsx', 'client');

    result.serverModules = await bundleApp(
      options,
      result.diagnostics,
      '/entry.server.tsx',
      'server'
    );
  } catch (e) {
    result.diagnostics.push({
      message: String(e),
      severity: 'Error',
    });
    console.error(e);
  }

  self.result = result;

  await sendMessageToIframe(result);

  console.timeEnd('Update');
};

const bundleApp = async (options, diagnostics, inputPath, buildType) => {
  console.time(`Bundle ${buildType}`);

  const isSsr = buildType === 'server';

  const qwikRollupPluginOpts = {
    srcInputs: options.srcInputs,
    entryStrategy: options.entryStrategy,
    minify: options.minify,
    debug: options.debug,
    ssrBuild: isSsr,
  };

  const rollupInputOpts = {
    input: inputPath,
    cache: self.rollupCache,
    plugins: [
      self.qwikOptimizer.qwikRollup(qwikRollupPluginOpts),
      {
        resolveId(importee, importer) {
          if (!importer) {
            return importee;
          }

          if (importee === '@builder.io/qwik' || importee === '@builder.io/qwik/jsx-runtime') {
            // return '\0@qwik-core';
            return {
              id: `/repl/core.mjs`,
              external: true,
            };
          }

          if (importee === '@builder.io/qwik/server') {
            return {
              id: `/repl/server.mjs`,
              external: true,
            };
          }

          return {
            id: importee,
            external: true,
          };
        },
        load(id) {
          if (id === '\0@qwik-core') {
            return self.coreEsmCode;
          }
          if (id === '\0@qwik-server') {
            return self.serverEsmCode;
          }
          return null;
        },
      },
    ],
    onwarn(warning) {
      diagnostics.push({ message: warning.message });
    },
  };

  const rollupOutputOpts = {
    format: 'es',
    inlineDynamicImports: isSsr,
  };

  const bundle = await self.rollup.rollup(rollupInputOpts);

  self.rollupCache = bundle.cache;

  const generated = await bundle.generate(rollupOutputOpts);

  const outputs = generated.output.map((o) => ({
    path: o.fileName,
    code: o.code,
    isEntry: o.isDynamicEntry,
  }));

  console.timeEnd(`Bundle ${buildType}`);

  return outputs;
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
    !self.rollup ||
    !self.coreEsmCode ||
    self.qwikCore.version !== version ||
    self.qwikOptimizer.versions.qwik !== version
  ) {
    console.time('Load dependencies');
    self.qwikCore = self.qwikOptimizer = null;
    self.coreEsmCode = null;
    self.rollup = null;

    const coreCjsUrl = `/repl/core.cjs`;
    const coreEsmUrl = `/repl/core.mjs`;
    const optimizerCjsUrl = `/repl/optimizer.cjs`;
    const serverEsmUrl = `/repl/server.mjs`;
    const rollupUrl = getNpmCdnUrl('rollup', rollupVersion, '/dist/rollup.browser.js');

    const depUrls = [coreCjsUrl, coreEsmUrl, optimizerCjsUrl, serverEsmUrl, rollupUrl];

    const rsps = await Promise.all(depUrls.map((u) => fetch(u)));

    rsps.forEach((rsp) => {
      if (!rsp.ok) {
        throw new Error(`Unable to load dependency: ${rsp.url}`);
      }
    });

    const [coreCjsCode, coreEsmCode, optimizerCjsCode, serverEsmCode, rollupCode] =
      await Promise.all(rsps.map((rsp) => rsp.text()));

    self.coreEsmCode = coreEsmCode;
    self.serverEsmCode = serverEsmCode;

    const coreApply = new Function(coreCjsCode);
    const optimizerApply = new Function(optimizerCjsCode);
    const rollupApply = new Function(rollupCode);

    coreApply();
    console.debug(`Loaded @builder.io/qwik: ${self.qwikCore.version}`);
    optimizerApply();
    console.debug(`Loaded @builder.io/qwik/optimizer: ${self.qwikOptimizer.versions.qwik}`);
    rollupApply();
    console.debug(`Loaded rollup: ${self.rollup.VERSION}`);
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

self.onfetch = (ev) => {
  const reqUrl = new URL(ev.request.url);
  const pathname = reqUrl.pathname;

  if (self.result) {
    const modules = self.result.transformModules;
    if (Array.isArray(modules)) {
      const module = modules.find((m) => {
        const moduleUrl = new URL('./' + m.path, reqUrl);
        return pathname === moduleUrl.pathname;
      });
      if (module) {
        return ev.respondWith(
          new Response(module.code, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-store',
              'X-QWIK-REPL': self.qwikCore.version,
            },
          })
        );
      }
    }
  }
};

self.onmessage = receiveMessageFromIframe;

self.oninstall = () => self.skipWaiting();

self.onactivate = () => self.clients.claim();

const rollupVersion = '2.70.1';
const terserVersion = '5.12.1';

const getNpmCdnUrl = (package, version, path) =>
  new URL(`https://cdn.jsdelivr.net/npm/${package}${version ? '@' + version : ''}${path}`);
