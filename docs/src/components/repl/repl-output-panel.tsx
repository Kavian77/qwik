import { ReplOutputModles } from './repl-output-modules';
import { ReplTabButton } from './repl-tab-button';
import type { ReplStore } from './types';

export const ReplOutputPanel = ({ store }: ReplOutputPanelProps) => {
  return (
    <>
      <div class="output-tabs repl-tabs">
        <ReplTabButton
          text="Document"
          isActive={store.selectedOutputPanel === 'app'}
          onClick$={() => {
            store.selectedOutputPanel = 'app';
          }}
        />

        <ReplTabButton
          text="HTML"
          isActive={store.selectedOutputPanel === 'outputHtml'}
          onClick$={() => {
            store.selectedOutputPanel = 'outputHtml';
          }}
        />

        <ReplTabButton
          text="Client Modules"
          isActive={store.selectedOutputPanel === 'clientModules'}
          onClick$={() => {
            store.selectedOutputPanel = 'clientModules';
          }}
        />

        <ReplTabButton
          text="SSR Module"
          isActive={store.selectedOutputPanel === 'serverModules'}
          onClick$={() => {
            store.selectedOutputPanel = 'serverModules';
          }}
        />

        {store.diagnostics.length > 0 ? (
          <ReplTabButton
            text={`Diagnostics (${store.diagnostics.length})`}
            cssClass={{ 'repl-tab-diagnostics': true }}
            isActive={store.selectedOutputPanel === 'diagnostics'}
            onClick$={() => {
              store.selectedOutputPanel = 'diagnostics';
            }}
          />
        ) : null}
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
            <ReplOutputModles buildPath="/build/" outputs={store.clientModules} />
          ) : null}
        </div>
        <div
          class={{
            'active-output': store.selectedOutputPanel === 'serverModules',
            'output-result': true,
          }}
        >
          {store.selectedOutputPanel === 'serverModules' ? (
            <ReplOutputModles buildPath="/server/" outputs={store.ssrModules} />
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
    </>
  );
};

interface ReplOutputPanelProps {
  store: ReplStore;
}
