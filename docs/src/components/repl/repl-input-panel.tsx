import { Editor } from './editor';
import { ReplTabButton } from './repl-tab-button';
import type { ReplStore } from './types';

export const ReplInputPanel = ({ store, onInputChange, onInputDelete }: ReplInputPanelProps) => {
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
              if (store.enableFileDelete) {
                const shouldDelete = confirm(`Are you sure you want to delete "${input.path}"?`);
                if (shouldDelete) {
                  onInputDelete(input.path);
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
  onInputDelete: (path: string) => void;
}
