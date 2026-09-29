export interface ComponentTextField {
  id: string;
  path: number[];
  origin: string;
  value: string;
}

export interface ComponentVisualField {
  id: string;
  elementPath: number[];
  symbolPath: number[] | null;
  labelPath: number[] | null;
  label: string;
  symbol: string;
  color: string;
  backgroundColor: string;
  hidden: boolean;
}

function nodePath(node: Node, root: Node): number[] | null {
  const path: number[] = [];
  let current: Node | null = node;
  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) return null;
    const index = Array.prototype.indexOf.call(parent.childNodes, current) as number;
    if (index < 0) return null;
    path.unshift(index);
    current = parent;
  }
  return current === root ? path : null;
}

function nodeAtPath(root: Node, path: number[]): Node | null {
  let current: Node = root;
  for (const index of path) {
    const next = current.childNodes.item(index);
    if (!next) return null;
    current = next;
  }
  return current;
}

function visibleTextNodes(root: Node): Text[] {
  const document = root.ownerDocument;
  if (!document) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const result: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (!parent?.closest('style,script,template') && node.nodeValue?.trim()) result.push(node as Text);
    node = walker.nextNode();
  }
  return result;
}

function directTextNodes(element: Element): Text[] {
  return Array.from(element.childNodes).filter((node): node is Text =>
    node.nodeType === Node.TEXT_NODE && Boolean(node.nodeValue?.trim()),
  );
}

function classLooksVisual(element: Element): boolean {
  const value = `${element.getAttribute('class') ?? ''} ${element.getAttribute('data-icon') ?? ''}`;
  return /(?:^|[-_\s])(icon|icone|check|tick|benefit|avantage|bullet|badge)(?:$|[-_\s])/i.test(value);
}

function symbolLike(value: string): boolean {
  return value.length <= 4 && /[^\p{L}\p{N}\s]/u.test(value);
}

function nearestLabel(element: Element): Text | null {
  const sibling = element.nextElementSibling;
  if (sibling) return visibleTextNodes(sibling).find((node) => (node.nodeValue ?? '').trim().length >= 2) ?? null;
  const parent = element.parentElement;
  if (!parent) return null;
  const index = Array.prototype.indexOf.call(parent.children, element) as number;
  for (const candidate of Array.from(parent.children).slice(index + 1)) {
    const text = visibleTextNodes(candidate).find((node) => (node.nodeValue ?? '').trim().length >= 2);
    if (text) return text;
  }
  return null;
}

export function extractComponentTexts(html: string): ComponentTextField[] {
  if (!html.trim()) return [];
  const document = new DOMParser().parseFromString(html, 'text/html');
  return visibleTextNodes(document.body)
    .map((node) => {
      const path = nodePath(node, document.body);
      const value = node.nodeValue?.trim() ?? '';
      return path && value.length >= 2 ? { id: `text:${path.join('.')}`, path, origin: value, value } : null;
    })
    .filter((field): field is ComponentTextField => field !== null)
    .slice(0, 48);
}

export function replaceComponentText(html: string, path: number[], next: string): string {
  if (!html.trim()) return html;
  const document = new DOMParser().parseFromString(html, 'text/html');
  const node = nodeAtPath(document.body, path);
  if (!node || node.nodeType !== Node.TEXT_NODE || node.parentElement?.closest('style,script,template')) return html;
  const raw = node.nodeValue ?? '';
  node.nodeValue = `${raw.match(/^\s*/)?.[0] ?? ''}${next}${raw.match(/\s*$/)?.[0] ?? ''}`;
  return document.body.innerHTML;
}

export function extractComponentVisuals(html: string): ComponentVisualField[] {
  if (!html.trim()) return [];
  const document = new DOMParser().parseFromString(html, 'text/html');
  const candidates = Array.from(document.body.querySelectorAll('*')).filter((element) => {
    if (element.closest('style,script,template')) return false;
    const direct = directTextNodes(element).map((node) => node.nodeValue?.trim() ?? '').join('');
    return (symbolLike(direct) || classLooksVisual(element)) && Boolean(nearestLabel(element));
  });
  return candidates.map((element, index) => {
    const elementPath = nodePath(element, document.body)!;
    const symbolNode = directTextNodes(element)[0] ?? null;
    const labelNode = nearestLabel(element);
    const style = (element as HTMLElement).style;
    return {
      id: `visual:${elementPath.join('.')}`,
      elementPath,
      symbolPath: symbolNode ? nodePath(symbolNode, document.body) : null,
      labelPath: labelNode ? nodePath(labelNode, document.body) : null,
      label: labelNode?.nodeValue?.trim() ?? `Élément visuel ${index + 1}`,
      symbol: symbolNode?.nodeValue?.trim() ?? '',
      color: style.color || '',
      backgroundColor: style.backgroundColor || '',
      hidden: style.display === 'none',
    };
  }).slice(0, 24);
}

export function updateComponentVisual(
  html: string,
  visual: ComponentVisualField,
  change: Partial<Pick<ComponentVisualField, 'label' | 'symbol' | 'color' | 'backgroundColor' | 'hidden'>>,
): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const element = nodeAtPath(document.body, visual.elementPath);
  if (!(element instanceof HTMLElement)) return html;
  if (change.label !== undefined && visual.labelPath) {
    const label = nodeAtPath(document.body, visual.labelPath);
    if (label?.nodeType === Node.TEXT_NODE) label.nodeValue = `${label.nodeValue?.match(/^\s*/)?.[0] ?? ''}${change.label}${label.nodeValue?.match(/\s*$/)?.[0] ?? ''}`;
  }
  if (change.symbol !== undefined && visual.symbolPath) {
    const symbol = nodeAtPath(document.body, visual.symbolPath);
    if (symbol?.nodeType === Node.TEXT_NODE) symbol.nodeValue = `${symbol.nodeValue?.match(/^\s*/)?.[0] ?? ''}${change.symbol}${symbol.nodeValue?.match(/\s*$/)?.[0] ?? ''}`;
  }
  if (change.color !== undefined) element.style.color = change.color;
  if (change.backgroundColor !== undefined) element.style.backgroundColor = change.backgroundColor;
  if (change.hidden !== undefined) element.style.display = change.hidden ? 'none' : '';
  return document.body.innerHTML;
}
