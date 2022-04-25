import {
  component$,
  Host,
  noSerialize,
  useEffect$,
  useHostElement,
  useStore,
} from '@builder.io/qwik';
import { TransformModuleInput } from '@builder.io/qwik/optimizer';
import type MonacoTypes from 'monaco-editor';

export const Monaco = component$((props: MonacoProps) => {
  const hostElm = useHostElement() as HTMLElement;

  const store = useStore<MonacoStore>({
    editor: undefined,
  });

  useEffect$(() => {
    if (typeof document !== 'undefined') {
      if (!store.editor) {
        initMonaco(hostElm, props, store);
      }
    }
  });

  return <Host className="monaco-editor-container" />;
});

interface MonacoProps {
  inputs: TransformModuleInput[];
  selectedPath: string;
}

interface MonacoStore {
  editor: MonacoTypes.editor.IStandaloneCodeEditor | undefined;
}

export const initMonaco = async (containerElm: any, props: MonacoProps, store: MonacoStore) => {
  const monaco = await getMonaco();

  store.editor = noSerialize(
    monaco.editor.create(containerElm, {
      minimap: { enabled: false },
      model: null,
    })
  );

  const models = monaco.editor.getModels();
  for (const m of models) {
    m.dispose();
  }

  const input = props.inputs.find((p) => p.path === props.selectedPath);
  if (input) {
    const uri = monaco.Uri.parse(`file://${props.selectedPath}`);

    const model =
      monaco.editor.getModel(uri) || monaco.editor.createModel(input.code, 'typescript', uri);

    store.editor!.setModel(model);
  }
};

const getMonaco = async (): Promise<typeof MonacoTypes> => {
  if (!monacoInstance.promise) {
    monacoInstance.promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.addEventListener('error', reject);
      script.addEventListener('load', () => {
        require.config({ paths: { vs: MONACO_VS_URL } });
        require(['vs/editor/editor.main'], () => {
          resolve(monaco);
        });
      });
      script.async = true;
      script.src = MONACO_LOADER_URL;
      document.head.appendChild(script);
    });
  }
  return monacoInstance.promise;
};

const monacoInstance: any = {
  promise: null,
};

const MONACO_VERSION = `0.33.0`;
const MONACO_URL = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}`;
const MONACO_VS_URL = `${MONACO_URL}/min/vs`;
const MONACO_LOADER_URL = `${MONACO_VS_URL}/loader.js`;

declare const monaco: typeof MonacoTypes;
declare const require: any;
