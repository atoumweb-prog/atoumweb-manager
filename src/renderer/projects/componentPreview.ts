export interface ComponentPreviewPart {
  html: string;
  css: string;
  label: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Root rules belong to the component, not to the whole preview page.
function componentCss(css: string): string {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  function scopeRules(rules: CSSRuleList): string {
    return Array.from(rules).map((rule) => {
      if (rule instanceof CSSStyleRule) {
        const selector = rule.selectorText
          .replace(/:root\b/g, ':host')
          .replace(/(^|[\s>+~,(])(?:html|body)(?=[\s>+~.#:[),]|$)/gi, '$1:host')
          .replace(/:host\s+:host/g, ':host');
        return `${selector}{${rule.style.cssText}}`;
      }
      if (rule instanceof CSSGroupingRule) {
        return `${rule.cssText.slice(0, rule.cssText.indexOf('{'))}{${scopeRules(rule.cssRules)}}`;
      }
      return rule.cssText;
    }).join('\n');
  }
  return scopeRules(sheet.cssRules).replace(/<\/style/gi, '<\\/style');
}

export function buildComponentPreview(parts: ComponentPreviewPart[], inspect = false): string {
  const slices = parts.map((part, index) => {
    const parsed = new DOMParser().parseFromString(part.html, 'text/html');
    const embeddedCss = Array.from(parsed.querySelectorAll('style')).map((style) => style.textContent ?? '').join('\n');
    // Previews are static; source code is neither executed nor modified.
    parsed.querySelectorAll('style,script,base,meta,link,iframe,object,embed').forEach((node) => node.remove());
    const content = parsed.body.innerHTML || '<p>Aucun HTML prévisualisable.</p>';
    return `<section class="aw-preview-slice">${inspect ? `<div class="aw-preview-label">${index + 1}. ${escapeHtml(part.label)}</div>` : ''}
<div class="aw-preview-host"><template shadowrootmode="open">
<style>:host{display:block;color:#111;background:#fff;font-family:Arial,Helvetica,sans-serif}*,*::before,*::after{box-sizing:border-box}
${componentCss(`${part.css}\n${embeddedCss}`)}</style>${content}
</template></div></section>`;
  }).join('\n');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:;">
<style>html,body{margin:0;background:#fff;color:#111}body{font-family:Arial,Helvetica,sans-serif}
.aw-preview-slice{display:flow-root;position:relative;contain:layout paint;isolation:isolate;min-height:40px}
.aw-preview-label{padding:6px 10px;background:#181b20;color:#fff;font:12px Arial;position:relative;z-index:2147483647}
${inspect ? '.aw-preview-slice{outline:2px dashed #c59a4a;outline-offset:-2px}' : ''}</style></head><body>${slices}</body></html>`;
}
