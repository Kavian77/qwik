import { CloseIcon } from '../svgs/close-icon';

export const ReplTabButton = (props: ReplTabButtonProps) => {
  return (
    <div class={{ 'active-tab': props.isActive, 'repl-tab': true, ...props.cssClass }}>
      <button class="repl-tab-select" onClickQrl={props.onClickQrl}>
        {props.text}
      </button>
      {props.enableDelete ? (
        <button class="repl-tab-delete" onClickQrl={props.onDeleteQrl}>
          <CloseIcon width={9} height={9} />
        </button>
      ) : null}
    </div>
  );
};

interface ReplTabButtonProps {
  text: string;
  isActive: boolean;
  enableDelete?: boolean;
  onClick$: () => void;
  onDelete$?: () => void;
  onClickQrl?: any;
  onDeleteQrl?: any;
  cssClass?: Record<string, boolean>;
}
