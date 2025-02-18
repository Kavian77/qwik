import { component$, Host, useStyles$ } from '@builder.io/qwik';
import { useLocation } from '../../utils/useLocation';
import { Header } from '../../components/header/header';
import type { SiteStore } from '../../components/app/app';
import styles from './builder.css?inline';

interface BuilderProps {
  store: SiteStore;
}

export const Builder = component$(async (props: BuilderProps) => {
  useStyles$(styles);
  const loc = useLocation();
  const html = await fetchQwikBuilderContent(loc.pathname);
  return (
    <Host>
      <Header store={props.store} />
      {html && <main class="builder" dangerouslySetInnerHTML={html} />}
    </Host>
  );
});

export const fetchQwikBuilderContent = async (url: string) => {
  const qwikUrl = new URL('https://cdn.builder.io/api/v1/qwik/content-page');
  qwikUrl.searchParams.set('apiKey', 'fe30f73e01ef40558cd69a9493eba2a2');
  qwikUrl.searchParams.set('userAttributes.urlPath', url);

  const response = await fetch(String(qwikUrl));
  if (response.status === 200) {
    const { html } = await response.json();
    return html;
  }
  return undefined;
};
