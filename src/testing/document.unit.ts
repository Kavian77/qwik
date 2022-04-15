/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */

import { createWindow } from './document';
import { pathToFileURL } from 'url';

describe('window', () => {
  it('should create document', () => {
    const win = createWindow({
      url: pathToFileURL(__filename),
    });
    expect(win.document.baseURI).toContain('file://');
    expect(win.document.baseURI).toContain('document.unit.ts');
  });
});
