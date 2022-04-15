/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */

import { createWindow as createServerWindow } from '@builder.io/qwik/server';
import { setTestPlatform } from './platform';
import type { MockDocumentOptions, MockWindowOptions, MockDocument, MockWindow } from './types';

/**
 * Create emulated `QwikGlobal` useful for testing.
 */
export function createWindow(opts: MockDocumentOptions = {}): MockWindow {
  const win = createServerWindow(opts);
  setTestPlatform(win.document);
  return win as any;
}

/**
 * Create emulated `Document` in node environment.
 */
export function createDocument(opts: MockWindowOptions = {}): MockDocument {
  const gbl = createWindow(opts);
  return gbl.document;
}
