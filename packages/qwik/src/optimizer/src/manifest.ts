import type { QwikBundle, QwikManifest, QwikSymbol } from './types';

// This is just the initial prioritization of the symbols and entries
// at build time so there's less work during each SSR. However, SSR should
// still further optimize the priorities depending on the user/document.
// This also helps ensure a stable q-manifest.json file.

function prioritorizeSymbolNames(manifest: QwikManifest) {
  const symbols = manifest.symbols;

  return Object.keys(symbols).sort((symbolNameA, symbolNameB) => {
    const a = symbols[symbolNameA];
    const b = symbols[symbolNameB];

    // events should sort highest
    if (a.ctxKind === 'event' && b.ctxKind !== 'event') {
      return -1;
    }
    if (a.ctxKind !== 'event' && b.ctxKind === 'event') {
      return 1;
    }

    if (a.ctxKind === 'event' && b.ctxKind === 'event') {
      // both are an event
      const aIndex = EVENT_PRIORITY.indexOf(a.ctxName.toLowerCase());
      const bIndex = EVENT_PRIORITY.indexOf(b.ctxName.toLowerCase());

      if (aIndex > -1 && bIndex > -1) {
        // both symbols have an event with a prioritory
        if (aIndex < bIndex) {
          return -1;
        }
        if (aIndex > bIndex) {
          return 1;
        }
      } else {
        if (aIndex > -1) {
          // just symbol "a" has an event with a priority
          return -1;
        }
        if (bIndex > -1) {
          // just symbol "b" has an event with a priority
          return 1;
        }
      }
    } else if (a.ctxKind === 'function' && b.ctxKind === 'function') {
      // both are a function
      const aIndex = FUNCTION_PRIORITY.indexOf(a.ctxName.toLowerCase());
      const bIndex = FUNCTION_PRIORITY.indexOf(b.ctxName.toLowerCase());

      if (aIndex > -1 && bIndex > -1) {
        // both symbols have a function with a prioritory
        if (aIndex < bIndex) {
          return -1;
        }
        if (aIndex > bIndex) {
          return 1;
        }
      } else {
        if (aIndex > -1) {
          // just symbol "a" has a function with a priority
          return -1;
        }
        if (bIndex > -1) {
          // just symbol "b" has a function with a priority
          return 1;
        }
      }
    }

    // symbols with no "parent" have a higher priority
    if (!a.parent && b.parent) {
      return -1;
    }
    if (a.parent && !b.parent) {
      return 1;
    }

    // captures "true" has higher priority
    if (a.captures && !b.captures) {
      return -1;
    }
    if (!a.captures && b.captures) {
      return 1;
    }

    // sort by ctxName i guess
    if (a.ctxName < b.ctxName) {
      return -1;
    }
    if (a.ctxName > b.ctxName) {
      return 1;
    }

    // idk, they're pretty darn similar, just sort by the symbol name
    if (symbolNameA < symbolNameB) {
      return -1;
    }
    if (symbolNameA > symbolNameB) {
      return 1;
    }
    return 0;
  });
}

// User triggered events should have priority
const EVENT_PRIORITY = [
  // Click Events
  'onClick$',
  'onDblClick$',
  'onContextMenu$',
  'onAuxClick$',

  // Pointer Events
  'onPointerDown$',
  'onPointerUp$',
  'onPointerMove$',
  'onPointerOver$',
  'onPointerEnter$',
  'onPointerLeave$',
  'onPointerOut$',
  'onPointerCancel$',
  'onGotPointerCapture$',
  'onLostPointerCapture$',

  // Touch Events
  'onTouchStart$',
  'onTouchEnd$',
  'onTouchMove$',
  'onTouchCancel$',

  // Mouse Events
  'onMouseDown$',
  'onMouseUp$',
  'onMouseMove$',
  'onMouseEnter$',
  'onMouseLeave$',
  'onMouseOver$',
  'onMouseOut$',
  'onWheel$',

  // Gesture Events
  'onGestureStart$',
  'onGestureChange$',
  'onGestureEnd$',

  // Keyboard Events
  'onKeyDown$',
  'onKeyUp$',
  'onKeyPress$',

  // Input/Change Events
  'onInput$',
  'onChange$',
  'onSearch$',
  'onInvalid$',
  'onBeforeInput$',
  'onSelect$',

  // Focus/Blur Events
  'onFocusIn$',
  'onFocusOut$',
  'onFocus$',
  'onBlur$',

  // Form Events
  'onSubmit$',
  'onReset$',

  // Scroll Events
  'onScroll$',
].map((n) => n.toLowerCase());

const FUNCTION_PRIORITY = [
  'useClientEffect$',
  'useEffect$',
  'component$',
  'useStyles$',
  'useScopedStyles$',
].map((n) => n.toLowerCase());

function prioritorizeBundles(manifest: QwikManifest) {
  // this doesn't really matter at build time
  // but standardizing the order helps make this file stable
  return Object.keys(manifest.bundles).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
}

export function updateManifestPriorities(manifest: QwikManifest) {
  const prioritorizedSymbolNames = prioritorizeSymbolNames(manifest);
  const prioritorizedSymbols: { [symbolName: string]: QwikSymbol } = {};
  const prioritorizedMapping: { [symbolName: string]: string } = {};

  for (const symbolName of prioritorizedSymbolNames) {
    prioritorizedSymbols[symbolName] = manifest.symbols[symbolName];
    prioritorizedMapping[symbolName] = manifest.mapping[symbolName];
  }

  const prioritorizedBundleNames = prioritorizeBundles(manifest);
  const prioritorizedBundles: { [fileName: string]: QwikBundle } = {};
  for (const bundleName of prioritorizedBundleNames) {
    const entry = (prioritorizedBundles[bundleName] = manifest.bundles[bundleName]);
    if (entry.imports) {
      entry.imports.sort();
    }
    if (entry.dynamicImports) {
      entry.dynamicImports.sort();
    }
  }

  manifest.symbols = prioritorizedSymbols;
  manifest.mapping = prioritorizedMapping;
  manifest.bundles = prioritorizedBundles;

  if (manifest.injections) {
    manifest.injections.sort();
  }

  return manifest;
}

export function getValidManifest(manifest: QwikManifest | undefined | null) {
  if (
    manifest != null &&
    manifest.mapping != null &&
    typeof manifest.mapping === 'object' &&
    manifest.symbols != null &&
    typeof manifest.symbols === 'object' &&
    manifest.bundles != null &&
    typeof manifest.bundles === 'object'
  ) {
    return manifest;
  }
  return undefined;
}
