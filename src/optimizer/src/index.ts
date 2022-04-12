export { createOptimizer } from './optimizer';
export { versions } from './versions';
export * from './types';

// TODO: create separate @builder.io/qwik-rollup package
export type { QwikPluginOptions, QwikViteOptions, QwikViteSSROptions } from './rollup/index';
export { qwikRollup, qwikVite } from './rollup/index';
