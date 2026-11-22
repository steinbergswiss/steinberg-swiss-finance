// In-place page translation. No redirects, no popups, no new tabs —
// the signed-in session always survives.

let currentLang = 'en';

export function getCurrentLang() {
  return currentLang;
}

async function googleTranslate(text, lang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
    lang,
  )}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('google translate failed');
  const data = await res.json();
  return (data[0] || []).map((seg) => seg[0]).join('');
}

async function myMemoryTranslate(text, lang) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=en|${encodeURIComponent(lang)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('mymemory failed');
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || data?.responseStatus !== 200) throw new Error('mymemory no result');
  return out;
}

async function translateText(text, lang) {
  try {
    return await googleTranslate(text, lang);
  } catch {
    return await myMemoryTranslate(text, lang);
  }
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG']);

function collectNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const t = node.textContent.trim();
      if (!t || t.length > 500) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

export async function translateDom(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  const nodes = collectNodes(document.body);
  const texts = [...new Set(nodes.map((n) => n.textContent.trim()))];

  const map = new Map();
  const BATCH = 12;
  for (let i = 0; i < texts.length; i += BATCH) {
    const chunk = texts.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (t) => {
        try {
          const tr = await translateText(t, lang);
          if (tr) map.set(t, tr);
        } catch {
          /* keep original text */
        }
      }),
    );
  }

  nodes.forEach((n) => {
    const t = n.textContent.trim();
    if (map.has(t)) {
      n.textContent = n.textContent.replace(t, map.get(t));
    }
  });
}

export async function resetTranslation() {
  currentLang = 'en';
  document.documentElement.lang = 'en';
  // Session lives in localStorage, so a reload keeps the user signed in.
  window.location.reload();
}
