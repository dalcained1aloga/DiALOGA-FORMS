/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExportToHtmlParams {
  title: string;
  filename: string;
  watermarkUrl: string;
  watermarkOpacity: number;
  watermarkStyle: 'tiled' | 'centered';
}

const STAGING_ID = 'html-export-staging';

const VISUAL_PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'box-sizing',
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'align-items',
  'align-self',
  'justify-content',
  'justify-self',
  'gap',
  'row-gap',
  'column-gap',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',
  'grid-column-start',
  'grid-column-end',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-style',
  'white-space',
  'word-break',
  'color',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'opacity',
  'overflow',
  'overflow-x',
  'overflow-y',
  'object-fit',
  'transform',
  'transform-origin',
  'vertical-align',
  'list-style-type',
  'accent-color',
  '-webkit-print-color-adjust',
  'print-color-adjust',
  'order',
  'float',
  'clear',
  'visibility',
] as const;

const SKIP_PROPERTIES = new Set([
  'cursor',
  'pointer-events',
  'user-select',
  'touch-action',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'outline',
  'outline-color',
  'outline-style',
  'outline-width',
  'outline-offset',
  'caret-color',
]);

/** Layout props that must not be inlined on the root sheet — they clip print flow. */
const ROOT_SHEET_SKIP_PROPERTIES = new Set([
  'height',
  'min-height',
  'max-height',
  'overflow',
  'overflow-x',
  'overflow-y',
  'justify-content',
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeExportFilename(name: string): string {
  const sanitized = name
    .trim()
    .replace(/[^\w\u00C0-\u024F\-.\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return sanitized || 'formulario';
}

function findPrintPaperSheet(): HTMLElement | null {
  const container = document.getElementById('print-paper-container');
  if (!container) return null;

  const printBlock = container.querySelector('.hidden.print\\:block');
  if (!printBlock) return null;

  return printBlock.querySelector('.paper-sheet') as HTMLElement | null;
}

function copyFormFieldValues(source: Element, clone: Element): void {
  if (
    source instanceof HTMLInputElement &&
    clone instanceof HTMLInputElement
  ) {
    if (source.type === 'checkbox' || source.type === 'radio') {
      clone.checked = source.checked;
    } else {
      clone.value = source.value;
    }
    if (source.type === 'radio') {
      clone.name = source.name;
    }
  } else if (
    source instanceof HTMLTextAreaElement &&
    clone instanceof HTMLTextAreaElement
  ) {
    clone.value = source.value;
  } else if (
    source instanceof HTMLSelectElement &&
    clone instanceof HTMLSelectElement
  ) {
    clone.value = source.value;
    const sourceOptions = source.options;
    const cloneOptions = clone.options;
    for (let i = 0; i < sourceOptions.length && i < cloneOptions.length; i++) {
      cloneOptions[i].selected = sourceOptions[i].selected;
    }
  }

  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < sourceChildren.length; i++) {
    if (cloneChildren[i]) {
      copyFormFieldValues(sourceChildren[i], cloneChildren[i]);
    }
  }
}

function buildInlineStyle(
  computed: CSSStyleDeclaration,
  options?: { isRootSheet?: boolean },
): string {
  const parts: string[] = [];
  const isRootSheet = options?.isRootSheet ?? false;

  for (const prop of VISUAL_PROPERTIES) {
    if (SKIP_PROPERTIES.has(prop)) continue;
    if (isRootSheet && ROOT_SHEET_SKIP_PROPERTIES.has(prop)) continue;

    const value = computed.getPropertyValue(prop);
    if (!value || value === 'initial' || value === 'inherit') continue;

    if (
      (prop === 'overflow' || prop === 'overflow-x' || prop === 'overflow-y') &&
      value === 'hidden'
    ) {
      continue;
    }

    parts.push(`${prop}:${value}`);
  }

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop.startsWith('--')) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        parts.push(`${prop}:${value}`);
      }
    }
  }

  return parts.join(';');
}

function applyRootFlowOverrides(el: HTMLElement): void {
  const existing = el.getAttribute('style') || '';
  const overrides = [
    'height:auto',
    'min-height:auto',
    'max-height:none',
    'overflow:visible',
    'overflow-x:visible',
    'overflow-y:visible',
    'justify-content:flex-start',
  ].join(';');
  el.setAttribute('style', existing ? `${existing};${overrides}` : overrides);
}

function inlineComputedStyles(root: HTMLElement): void {
  const walk = (el: HTMLElement, isRootSheet = false) => {
    const computed = window.getComputedStyle(el);
    el.setAttribute('style', buildInlineStyle(computed, { isRootSheet }));
    if (isRootSheet) {
      applyRootFlowOverrides(el);
    }
    Array.from(el.children).forEach((child) => walk(child as HTMLElement));
  };
  walk(root, true);
}

function createStagingStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    #${STAGING_ID} {
      position: fixed;
      left: -10000px;
      top: 0;
      width: 8.5in;
      visibility: hidden;
      pointer-events: none;
      z-index: -1;
    }
    #${STAGING_ID} .paper-sheet {
      margin: 0 !important;
      padding: 24px !important;
      box-shadow: none !important;
      border: none !important;
      background: white !important;
      width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      justify-content: flex-start !important;
      position: relative !important;
    }
    #${STAGING_ID} .print-content-layer {
      position: relative;
      z-index: 1;
    }
    #${STAGING_ID} .field-container {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    #${STAGING_ID} .signature-container {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  `;
  return style;
}

function buildExportedStyles(): string {
  return `
    @page {
      margin: 0.75in;
      size: letter;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
    }
    .print-watermark-layer {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: var(--watermark-opacity);
    }
    .print-watermark-layer--centered {
      background-image: var(--watermark-url);
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 80% auto;
    }
    .print-watermark-layer--tiled {
      background-image: var(--watermark-url);
      background-repeat: repeat;
      background-size: 160px 160px;
    }
    .form-root {
      position: relative;
      z-index: 1;
      height: auto;
      min-height: auto;
      max-height: none;
      overflow: visible;
      justify-content: flex-start;
    }
    .field-container {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .signature-container {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `.trim();
}

function buildWatermarkMarkup(
  watermarkUrl: string,
  watermarkOpacity: number,
  watermarkStyle: 'tiled' | 'centered',
): string {
  const modifierClass =
    watermarkStyle === 'tiled'
      ? 'print-watermark-layer--tiled'
      : 'print-watermark-layer--centered';

  return `<div aria-hidden="true" class="print-watermark-layer ${modifierClass}" style="--watermark-url:url(${watermarkUrl});--watermark-opacity:${watermarkOpacity}"></div>`;
}

function triggerDownload(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportToHtml(params: ExportToHtmlParams): void {
  const sourceSheet = findPrintPaperSheet();
  if (!sourceSheet) {
    console.error('exportToHtml: print paper sheet not found');
    return;
  }

  const clone = sourceSheet.cloneNode(true) as HTMLElement;
  copyFormFieldValues(sourceSheet, clone);

  const staging = document.createElement('div');
  staging.id = STAGING_ID;
  const stagingStyle = createStagingStyles();
  document.head.appendChild(stagingStyle);
  staging.appendChild(clone);
  document.body.appendChild(staging);

  try {
    inlineComputedStyles(clone);
    clone.classList.add('form-root');

    const watermarkHtml = buildWatermarkMarkup(
      params.watermarkUrl,
      params.watermarkOpacity,
      params.watermarkStyle,
    );

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(params.title)}</title>
<style>${buildExportedStyles()}</style>
</head>
<body>
${watermarkHtml}
${clone.outerHTML}
</body>
</html>`;

    triggerDownload(html, params.filename);
  } finally {
    document.body.removeChild(staging);
    document.head.removeChild(stagingStyle);
  }
}
