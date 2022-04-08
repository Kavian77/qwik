import { component$, Host } from '@builder.io/qwik';

const Tutorial = component$(() => {
  useScopedStyles$(styles);

const Tutorial = component$((props: TutorialProps) => {
  return <Host class="tutorial">tutorial: {props.pathname}</Host>;
});

export default Tutorial;
