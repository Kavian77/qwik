import type {
  Diagnostic,
  MinifyMode,
  QwikRollupPluginOptions,
  TransformModuleInput,
  TransformModule,
} from '@builder.io/qwik/optimizer';

export interface ReplProps {
  appId: string;
  inputs?: TransformModuleInput[];
  selectedInputPath?: string;
  layout: 'narrow';
}

export interface ReplInputOptions extends Omit<QwikRollupPluginOptions, 'srcDir'> {
  srcInputs: TransformModuleInput[];
}

export interface ReplWindow extends Window {
  replClientInitialized: boolean;
  replIframeWindow: Window;
}

export interface ReplStore {
  appId: string;
  inputs: TransformModuleInput[];
  outputHtml: string;
  clientModules: TransformModule[];
  serverModules: TransformModule[];
  diagnostics: Diagnostic[];
  selectedInputPath: string;
  selectedOutputPanel: OutputPanel;
  selectedClientModule: string;
  selectedServerModule: string;
  minify: MinifyMode;
  ssrBuild: boolean;
  entryStrategy: string;
  version: string;
  debug: boolean;
  iframeUrl: string;
}

export interface ReplResult {
  type: 'result';
  appHtml: string;
  outputHtml: string;
  clientModules: TransformModule[];
  serverModules: TransformModule[];
  diagnostics: Diagnostic[];
  qwikloader: string;
  docElementAttributes: ReplResultAttributes;
  headAttributes: ReplResultAttributes;
  bodyAttributes: ReplResultAttributes;
  bodyInnerHtml: string;
}

export interface ReplResultAttributes {
  [attrName: string]: string;
}

export type OutputPanel = 'app' | 'outputHtml' | 'clientModules' | 'serverModules' | 'diagnostics';
