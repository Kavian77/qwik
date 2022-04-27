import { Editor } from './editor';
import { ReplTabButton } from './repl-tab-button';
import type { ReplStore } from './types';

export const ReplInputPanel = ({ store, onInputChange }: ReplInputPanelProps) => {
  return (
    <>
      <div class="input-tabs repl-tabs">
        {store.inputs.map((input) => (
          <ReplTabButton
            text={formatFilePath(input.path)}
            isActive={store.selectedInputPath === input.path}
            onClick$={() => {
              store.selectedInputPath = input.path;
            }}
            onDelete$={() => {
              store.inputs = store.inputs.filter((i) => i.path !== input.path);
              if (store.selectedInputPath === input.path) {
                if (store.inputs.length > 0) {
                  store.selectedInputPath = store.inputs[0].path;
                } else {
                  store.selectedInputPath = '';
                }
              }
            }}
            enableDelete={store.enableFileDelete}
          />
        ))}
      </div>

      <div class="input-panel">
        <Editor
          inputs={store.inputs}
          selectedPath={store.selectedInputPath}
          onChange={onInputChange}
          qwikVersion={store.version}
          ariaLabel="File Input"
          lineNumbers="on"
          readOnly={false}
          wordWrap="off"
        />
      </div>
    </>
  );
};

const formatFilePath = (path: string) => {
  if (path.startsWith('/')) {
    return path.substring(1);
  }
  return path;
};

interface ReplInputPanelProps {
  store: ReplStore;
  onInputChange: (path: string, code: string) => void;
}
