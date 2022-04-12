import { TutorialItem, menuItems } from './tutorial-menu';

export const TutorialContentFooter = ({ currentItem }: { currentItem: TutorialItem }) => {
  const currentIndex = menuItems.findIndex((i) => i.path === currentItem.path);
  const prev = menuItems[currentIndex - 1];
  const next = menuItems[currentIndex + 1];

  return (
    <div class="content-footer">
      <div>
        <button>Show Me</button>
      </div>
      <nav>
        <a hidden={!prev} href={prev ? prev.path : ''}>
          Previous
        </a>
        <a hidden={!next} href={next ? next.path : ''}>
          Next
        </a>
      </nav>
    </div>
  );
};
