import {
  component$,
  Host,
  useWatchEffect$,
  useHostElement,
  useStore,
  NoSerialize,
  noSerialize,
} from '@builder.io/qwik';
import type { TransformModuleInput } from '@builder.io/qwik/optimizer';
import { ICodeEditorViewState, initMonacoEditor, updateMonacoEditor } from './monaco';
import type { IModelContentChangedEvent, IStandaloneCodeEditor } from './monaco';
import { isBrowser } from '@builder.io/qwik/build';

export const Editor = component$((props: EditorProps) => {
  const hostElm = useHostElement() as HTMLElement;

  const store = useStore<EditorStore>({
    editor: undefined,
    onChangeDebounce: undefined,
    onChangeSubscription: undefined,
    resizeDebounce: undefined,
    viewStates: noSerialize({}),
  });

  useWatchEffect$(async (track) => {
    track(props, 'inputs');
    track(props, 'selectedPath');

    if (!store.editor) {
      await initMonacoEditor(hostElm, props, store);
    }

    if (isBrowser) {
      await updateMonacoEditor(props, store);
    }
  });

  // useCleanup$(() => {
  //   // TODO!
  //   if (store.editor) {
  //     store.editor.dispose();
  //   }
  // });

  return <Host className="editor-container" />;
});

export interface EditorProps {
  ariaLabel: string;
  editorId: string;
  inputs: TransformModuleInput[];
  lineNumbers: 'on' | 'off';
  onChange?: (value: string, ev: IModelContentChangedEvent) => void;
  readOnly: boolean;
  selectedPath: string;
  wordWrap: 'on' | 'off';
  qwikVersion: string;
}

export interface EditorStore {
  editor: NoSerialize<IStandaloneCodeEditor>;
  onChangeDebounce: NoSerialize<any>;
  onChangeSubscription: NoSerialize<any>;
  resizeDebounce: NoSerialize<any>;
  viewStates: NoSerialize<Record<string, ICodeEditorViewState>>;
}
