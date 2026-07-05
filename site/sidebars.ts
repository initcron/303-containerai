import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Setup',
      items: ['setup/prerequisites', 'setup/gpu-reality'],
    },
    {
      type: 'category',
      label: 'M1 · Container-Native GenAI',
      items: [
        'm1-container-native/lesson',
        'm1-container-native/lab',
        'm1-container-native/quiz',
      ],
    },
    {
      type: 'category',
      label: 'M2 · Serving Local Models',
      items: [
        'm2-serving/lesson',
        'm2-serving/lab',
        'm2-serving/quiz',
      ],
    },
  ],
};

export default sidebars;
