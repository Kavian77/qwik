import { defineConfig, Plugin } from 'vite';
import { qwikVite, TransformModuleInput } from '@builder.io/qwik/optimizer';
import { resolve, join, basename } from 'path';
import { qwest } from './qwest/dist/vite/index.mjs';
import { partytownVite } from '@builder.io/partytown/utils';
import { readdirSync, readFileSync, statSync } from 'fs';
import type { TutorialSection } from './src/layouts/tutorial/tutorial-data';
import type { PlaygroundApp } from './src/layouts/playground/playground-data';
import { PluginContext } from 'rollup';

export default defineConfig(() => {
  const pagesDir = resolve('pages');

  return {
    plugins: [
      qwikVite(),
      qwest({
        pagesDir,
        layouts: {
          tutorial: resolve('src', 'layouts', 'tutorial', 'tutorial.tsx'),
          default: resolve('src', 'layouts', 'docs', 'docs.tsx'),
        },
      }),
      partytownVite({
        dest: resolve('dist', '~partytown'),
      }),
      playgroundData(pagesDir),
      tutorialData(pagesDir),
    ],
    optimizeDeps: {
      include: ['@builder.io/qwik'],
    },
    clearScreen: false,
  };
});

function playgroundData(pagesDir: string): Plugin {
  const playgroundDir = join(pagesDir, 'playground');
  const playgroundMenuSrc = readFileSync(join(playgroundDir, 'playground-menu.json'), 'utf-8');

  const loadPlaygroundData = (ctx: PluginContext) => {
    const menuApps: PlaygroundApp[] = JSON.parse(playgroundMenuSrc);
    ctx.addWatchFile(playgroundMenuSrc);

    const apps: PlaygroundApp[] = [];

    try {
      for (const menuApp of menuApps) {
        const appDir = join(playgroundDir, menuApp.id);

        const app: PlaygroundApp = {
          id: menuApp.id,
          title: menuApp.title,
          inputs: readdirSync(appDir).map((fileName) => {
            const filePath = join(appDir, fileName);
            const input: TransformModuleInput = {
              path: '/' + fileName,
              code: readFileSync(filePath, 'utf-8'),
            };
            ctx.addWatchFile(filePath);
            return input;
          }),
        };

        if (app.inputs.length > 0) {
          apps.push(app);
        }
      }
    } catch (e) {
      console.error(e);
    }

    return apps;
  };

  return {
    name: 'playgroundData',

    async load(id) {
      const filename = basename(id);
      if (filename === 'playground-data.ts') {
        const data = loadPlaygroundData(this);
        return `const playgroundApps = ${JSON.stringify(data)};export default playgroundApps;`;
      }
      return null;
    },
  };
}

function tutorialData(pagesDir: string): Plugin {
  const tutorialDir = join(pagesDir, 'tutorial');
  const tutorialMenuSrc = readFileSync(join(tutorialDir, 'tutorial-menu.json'), 'utf-8');

  const loadTutorialData = async (ctx: PluginContext) => {
    const data: TutorialSection[] = JSON.parse(tutorialMenuSrc);
    ctx.addWatchFile(tutorialMenuSrc);

    const getTutorialApp = (sections: TutorialSection[], path: string): TutorialSection | null => {
      if (sections) {
        for (const t of sections) {
          if (t.path === path) {
            return t;
          }
          const c = getTutorialApp(t.items, path);
          if (c) {
            return c;
          }
        }
      }
      return null;
    };

    const readAppDir = (dir: string, id: string) => {
      const childItems = readdirSync(dir);
      childItems.map((childItem) => {
        const childPath = join(dir, childItem);
        if (childItem === 'app') {
          readAppInputs(childPath, id);
        } else {
          const s = statSync(childPath);
          if (s.isDirectory()) {
            readAppDir(childPath, `${id}/${childItem}`.trim());
          }
        }
      });
    };

    const readAppInputs = (dir: string, path: string) => {
      const app = getTutorialApp(data, path);
      if (app) {
        app.inputs = readdirSync(dir).map((fileName) => {
          const filePath = join(dir, fileName);
          const input: TransformModuleInput = {
            path: '/' + fileName,
            code: readFileSync(filePath, 'utf-8'),
          };
          ctx.addWatchFile(filePath);
          return input;
        });
      } else {
        console.error(`Tutorial app not found in the tutorial-menu.json: ${path}`);
      }
    };

    try {
      readAppDir(tutorialDir, '/tutorial');
    } catch (e) {
      console.error(e);
    }

    return data;
  };

  return {
    name: 'tutorialData',

    async load(id) {
      const filename = basename(id);
      if (filename === 'tutorial-data.ts') {
        const data = await loadTutorialData(this);
        return `const tutorials = ${JSON.stringify(data)};export default tutorials;`;
      }
      return null;
    },
  };
}
