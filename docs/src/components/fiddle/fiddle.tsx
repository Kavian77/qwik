import { component$, Host, $, useScopedStyles$, useStore } from '@builder.io/qwik';
import styles from './fiddle.css?inline';

export interface FiddleProps {
  inputs: FiddleFile[];
}

export interface FiddleFile {
  code: string;
  path: string;
  isSelected?: boolean;
}

export interface FiddleStore {
  inputs: FiddleFile[];
  selectedOutputPanel: 'result' | 'js' | 'html';
}

export const Fiddle = component$((props: FiddleProps) => {
  useScopedStyles$(styles);

  const store = useStore<FiddleStore>({
    inputs: props.inputs || [],
    selectedOutputPanel: 'result',
  });

  return $(() => {
    return (
      <Host class="fiddle">
        <div>
          Input:
          {store.inputs.map((input) => (
            <div hidden={!input.isSelected}>
              <div>File: {input.path}</div>
              <div>
                <textarea onInput$={(ev) => {}} value={input.code} />
              </div>
            </div>
          ))}
        </div>

        <div>
          Output:
          <textarea value={props.code} />
        </div>
      </Host>
    );
  });
});
