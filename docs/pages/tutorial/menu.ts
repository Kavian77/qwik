export const tutorialMenu: TutorialMenuSection[] = [
  {
    title: 'Introduction',
    items: [
      {
        title: 'Basics',
        href: '/tutorial/introduction/basics'
      }
    ]
  }
]

export interface TutorialMenuSection {
  title: string;
  items: TutorialMenuItem[];
}

export interface TutorialMenuItem {
  title: string;
  href: string;
}