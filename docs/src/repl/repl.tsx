import { component$, Host, useScopedStyles$, useStore } from '@builder.io/qwik';
import { CloseIcon } from '../components/svgs/close-icon';
import type {
  Diagnostic,
  MinifyMode,
  TransformModulesOptions,
  TransformModuleInput,
  TransformModule,
} from '@builder.io/qwik/optimizer';
import styles from './repl.css?inline';

export const Repl = component$(async (props: ReplProps) => {
  useScopedStyles$(styles);

  const store = useStore<ReplStore>({
    inputs: props.inputs || [],
    outputModules: [],
    diagnostics: [],
    selectedInputPath: '',
    selectedOutput: 'app',
    optimizerVersion: '0.0.18-7-dev20220408224756',
    transpile: true,
    minify: 'none',
    entryStrategy: 'hook',
    sourceMaps: false,
    iframeUrl: '',
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

    const onMessageFromSw = (ev: MessageEvent) => {
      const evData = ev.data;
      switch (evData?.type) {
        case 'resultAppReady': {
          window.replIframeWindow = ev.source as any;
          updateIFrame();
          break;
        }
      }
    };

    const updateIFrame = () => {
      const options: TransformModulesOptions = {
        rootDir: '/internal/project',
        transpile: store.transpile,
        minify: store.minify,
        entryStrategy: {
          type: store.entryStrategy as any,
        },
        explicityExtensions: true,
        sourceMaps: false,
        input: store.inputs,
      };
      const data = {
        type: 'update',
        version: store.optimizerVersion,
        options: JSON.parse(JSON.stringify(options)),
      };
      window.replIframeWindow?.postMessage(data);
    };

    window.addEventListener('message', onMessageFromSw);

    // setTimeout(async () => {
    //   const module = await importOptimizer;
    //   window.qwikOptimizer = await module.createOptimizer();

    //   const opts: TransformModulesOptions = {
    //     rootDir: '/internal/project',
    //     transpile: store.transpile,
    //     minify: store.minify,
    //     entryStrategy: {
    //       type: store.entryStrategy as any,
    //     },
    //     explicityExtensions: true,
    //     sourceMaps: false,
    //     input: store.inputs,
    //   };

    //   const output = await window.qwikOptimizer.transformModules(opts);

    //   store.outputModules = output.modules;
    //   store.diagnostics = output.diagnostics;

    //   console.log(output);
    // }, 100);
  }

  return (
    <Host class={{ repl: true, 'repl-narrow': props.layout === 'narrow' }} on>
      <div class="input-tabs repl-tabs">
        {store.inputs.map((input) => (
          <div class={{ 'active-tab': store.selectedInputPath === input.path, 'repl-tab': true }}>
            <button
              class="repl-tab-select"
              onClick$={() => {
                store.selectedInputPath = input.path;
              }}
            >
              {input.path}
            </button>
            <button
              class="repl-tab-delete"
              hidden={store.inputs.length < 2}
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
        <div class={{ 'active-tab': store.selectedOutput === 'app', 'repl-tab': true }}>
          <button class="repl-tab-select" onClick$={() => (store.selectedOutput = 'app')}>
            Result
          </button>
        </div>
        <div class={{ 'active-tab': store.selectedOutput === 'html', 'repl-tab': true }}>
          <button class="repl-tab-select" onClick$={() => (store.selectedOutput = 'html')}>
            HTML
          </button>
        </div>
        <div class={{ 'active-tab': store.selectedOutput === 'js', 'repl-tab': true }}>
          <button class="repl-tab-select" onClick$={() => (store.selectedOutput = 'js')}>
            JS
          </button>
        </div>
      </div>

      <div class="output-panel">
        <div class={{ 'active-output': store.selectedOutput === 'app', 'output-result': true }}>
          <iframe src={store.iframeUrl} />
        </div>
        <div
          class={{
            'active-output': store.selectedOutput === 'html',
            'output-result': true,
            'output-result-html': true,
          }}
        >
          html
        </div>
        <div
          class={{
            'active-output': store.selectedOutput === 'js',
            'output-result': true,
            'output-result-js': true,
          }}
        >
          js
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
  outputModules: TransformModule[];
  diagnostics: Diagnostic[];
  selectedInputPath: string;
  selectedOutput: OutputPanel;
  optimizerVersion: string;
  transpile: boolean;
  minify: MinifyMode;
  entryStrategy: string;
  sourceMaps: boolean;
  iframeUrl: string;
}

interface ReplWindow extends Window {
  replClientInitialized: boolean;
  replIframeWindow: Window;
}

declare const window: ReplWindow;

type OutputPanel = 'app' | 'js' | 'html';
