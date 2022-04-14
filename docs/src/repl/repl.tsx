import { component$, Host, useScopedStyles$, useStore } from '@builder.io/qwik';
import { CloseIcon } from '../components/svgs/close-icon';
import type {
  Diagnostic,
  MinifyMode,
  QwikPluginOptions,
  TransformModuleInput,
  TransformModule,
} from '@builder.io/qwik/optimizer';
import styles from './repl.css?inline';

export const Repl = component$(async (props: ReplProps) => {
  useScopedStyles$(styles);

  const store = useStore<ReplStore>({
    inputs: props.inputs || [],
    outputHtml: '',
    clientModules: [],
    serverModules: [],
    diagnostics: [],
    selectedInputPath: '',
    selectedOutputPanel: 'app',
    selectedClientModule: '',
    selectedServerModule: '',
    version: '0.0.18-7-dev20220408224756',
    minify: 'none',
    entryStrategy: 'single',
    iframeUrl: '',
    ssrBuild: true,
    debug: false
  });

  if (!store.selectedInputPath) {
    if (store.inputs.some((i) => i.path === props.selectedInputPath)) {
      store.selectedInputPath = props.selectedInputPath!;
    } else if (store.inputs.length > 0) {
      store.selectedInputPath = store.inputs[0].path;
    }
  }

  if (typeof window !== 'undefined' && !window.replClientInitialized) {
    window.replClientInitialized = true;
    store.iframeUrl = '/repl/index.html';

    const onMessageFromIframe = (ev: MessageEvent) => {
      if (ev.data.type === 'qwikReplReady') {
        window.replIframeWindow = ev.source as any;
        postInputUpdate();
      } else if (ev.data.type === 'result') {
        updateReplState(ev.data);
      }
    };

    const postInputUpdate = () => {
      const opts: ReplInputOptions = {
        srcInputs: store.inputs,
        minify: store.minify,
        entryStrategy: {
          type: store.entryStrategy as any,
        },
      };

      const data = {
        type: 'update',
        version: store.version,
        options: opts,
      };

      window.replIframeWindow?.postMessage(JSON.stringify(data));
    };

    const updateReplState = (result: ReplResult) => {
      store.outputHtml = result.outputHtml;
      store.clientModules = result.clientModules;
      store.serverModules = result.serverModules;
      store.diagnostics = result.diagnostics;

      if (!result.clientModules.some((m) => m.path === store.selectedClientModule)) {
        if (result.clientModules.length > 0) {
          store.selectedClientModule = result.clientModules[0].path;
        } else {
          store.selectedClientModule = '';
        }
      }

      if (!result.serverModules.some((m) => m.path === store.selectedServerModule)) {
        if (result.serverModules.length > 0) {
          store.selectedServerModule = result.serverModules[0].path;
        } else {
          store.selectedServerModule = '';
        }
      }

      if (result.diagnostics.length > 0) {
        store.selectedOutputPanel = 'diagnostics';
      } else if (result.diagnostics.length === 0 && store.selectedOutputPanel === 'diagnostics') {
        store.selectedOutputPanel = 'app';
      }
    };

    window.addEventListener('message', onMessageFromIframe);
  }

  const formatFilePath = (path: string) => {
    if (path.startsWith('/')) {
      return path.substring(1)
    }
    return path;
  }
  
  return (
    <Host class={{ repl: true, 'repl-narrow': props.layout === 'narrow' }}>
      <div class="input-tabs repl-tabs">
        {store.inputs.map((input) => (
          <div class={{ 'active-tab': store.selectedInputPath === input.path, 'repl-tab': true }}>
            <button
              class="repl-tab-select"
              onClick$={() => {
                store.selectedInputPath = input.path;
              }}
            >
              {formatFilePath(input.path)}
            </button>
            <button
              class="repl-tab-delete"
              hidden={input.path === '/main.tsx'}
              onClick$={() => {
                store.inputs = store.inputs.filter((i) => i.path !== input.path);
                if (store.selectedInputPath === input.path) {
                  if (store.inputs.length > 0) {
                    store.selectedInputPath = store.inputs[0].path;
                  } else {
                    store.selectedInputPath = '';
                  }
                }
              }}
            >
              <CloseIcon width={9} height={9} />
            </button>
          </div>
        ))}
      </div>

      <div class="input-panel">
        {store.inputs.map((input) => (
          <div
            class={{
              'active-input': store.selectedInputPath === input.path,
              'textarea-input-panel': true,
            }}
          >
            <textarea onInput$={(_, elm) => {}} value={input.code} />
          </div>
        ))}
      </div>

      <div class="output-tabs repl-tabs">
        <div class={{ 'active-tab': store.selectedOutputPanel === 'app', 'repl-tab': true }}>
          <button class="repl-tab-select" onClick$={() => (store.selectedOutputPanel = 'app')}>
            Result
          </button>
        </div>
        <div class={{ 'active-tab': store.selectedOutputPanel === 'outputHtml', 'repl-tab': true }}>
          <button
            class="repl-tab-select"
            onClick$={() => (store.selectedOutputPanel = 'outputHtml')}
          >
            HTML
          </button>
        </div>
        <div
          class={{
            'active-tab': store.selectedOutputPanel === 'clientModules',
            'repl-tab': true,
          }}
        >
          <button
            class="repl-tab-select"
            onClick$={() => (store.selectedOutputPanel = 'clientModules')}
          >
            Client Modules
          </button>
        </div>
        <div
          class={{ 'active-tab': store.selectedOutputPanel === 'serverModules', 'repl-tab': true }}
        >
          <button
            class="repl-tab-select"
            onClick$={() => (store.selectedOutputPanel = 'serverModules')}
          >
            Server Modules
          </button>
        </div>
        <div
          hidden={store.diagnostics.length === 0}
          class={{
            'active-tab': store.selectedOutputPanel === 'diagnostics',
            'repl-tab': true,
            'repl-tab-diagnostics': true,
          }}
        >
          <button
            class="repl-tab-select"
            onClick$={() => (store.selectedOutputPanel = 'diagnostics')}
          >
            Diagnostics ({store.diagnostics.length})
          </button>
        </div>
      </div>

      <div class="output-panel">
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'app',
            'output-result': true,
            'output-app': true,
          }}
        >
          <iframe src={store.iframeUrl} />
        </div>
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'outputHtml',
            'output-result': true,
          }}
        >
          {store.selectedOutputPanel === 'outputHtml' ? <pre>{store.outputHtml}</pre> : null}
        </div>
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'clientModules',
            'output-result': true,
          }}
        >
          {store.selectedOutputPanel === 'clientModules' ? (
            <>
              <select
                hidden={store.clientModules.length === 0}
                onChange$={(_, elm: any) => {
                  store.selectedClientModule = elm.value;
                }}
              >
                {store.clientModules.map((m) => (
                  <option selected={m.path === store.selectedClientModule} value={m.path}>
                    {m.path}
                  </option>
                ))}
              </select>
              {store.clientModules.map((m) =>
                m.path === store.selectedClientModule ? <pre>{m.code}</pre> : null
              )}
            </>
          ) : null}
        </div>
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'serverModules',
            'output-result': true,
          }}
        >
          {store.selectedOutputPanel === 'serverModules' ? (
            <>
              <select
                hidden={store.serverModules.length === 0}
                onChange$={(_, elm: any) => {
                  store.selectedServerModule = elm.value;
                }}
              >
                {store.serverModules.map((m) => (
                  <option selected={m.path === store.selectedServerModule} value={m.path}>
                    {m.path}
                  </option>
                ))}
              </select>
              {store.serverModules.map((m) =>
                m.path === store.selectedServerModule ? <pre>{m.code}</pre> : null
              )}
            </>
          ) : null}
        </div>
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'diagnostics',
            'output-result': true,
          }}
        >
          {store.diagnostics.map((d) => (
            <p>{d.message}</p>
          ))}
        </div>
      </div>

      <div class="footer-panel"> </div>
    </Host>
  );
});

export interface ReplProps {
  inputs?: TransformModuleInput[];
  selectedInputPath?: string;
  layout: 'narrow';
}

export interface ReplStore {
  inputs: TransformModuleInput[];
  outputHtml: string;
  clientModules: TransformModule[];
  serverModules: TransformModule[];
  diagnostics: Diagnostic[];
  selectedInputPath: string;
  selectedOutputPanel: OutputPanel;
  selectedClientModule: string;
  selectedServerModule: string;
  minify: MinifyMode;
  ssrBuild: boolean;
  entryStrategy: string;
  iframeUrl: string;
  version: string;debug:boolean;
}

interface ReplResult {
  type: 'result';
  outputHtml: string;
  clientModules: TransformModule[];
  serverModules: TransformModule[];
  diagnostics: Diagnostic[];
  docElementAttributes: ReplResultAttributes;
  headAttributes: ReplResultAttributes;
  headElements: { tagName: string; attributes: ReplResultAttributes }[];
  bodyAttributes: ReplResultAttributes;
  bodyInnerHtml: string;
}

interface ReplInputOptions extends Omit<QwikPluginOptions, 'srcDir'> {
  srcInputs: TransformModuleInput[];
}

interface ReplResultAttributes {
  [attrName: string]: string;
}

interface ReplWindow extends Window {
  replClientInitialized: boolean;
  replIframeWindow: Window;
}

declare const window: ReplWindow;

type OutputPanel = 'app' | 'outputHtml' | 'clientModules' | 'serverModules' | 'diagnostics';
