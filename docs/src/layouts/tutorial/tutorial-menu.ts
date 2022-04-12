export const menu: TutorialMenu = [
  {
    title: 'Introduction',
    items: [
      {
        title: 'Basics',
        path: '/tutorial/introduction/basics',
      },
      {
        title: 'Lazy Loading',
        path: '/tutorial/introduction/lazy-loading',
      },
    ],
  },
];

export const menuItems: TutorialItem[] = [];
menu.forEach((s) => menuItems.push(...s.items));

export type TutorialMenu = TutorialSection[];

export interface TutorialSection {
  title: string;
  items: TutorialItem[];
}

export interface TutorialItem {
  title: string;
  path: string;
}
