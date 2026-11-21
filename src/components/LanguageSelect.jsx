import { useState } from 'react';

// Google Translator for all major languages. Translations happen IN PLACE
// through the Google Translate element, so the visitor stays signed in
// (no page redirect). Falls back to the classic redirect only if the
// Google widget could not load.
const LANGS = [
  ['en', 'English'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
  ['pt', 'Português'],
  ['nl', 'Nederlands'],
  ['pl', 'Polski'],
  ['ru', 'Русский'],
  ['uk', 'Українська'],
  ['ar', 'العربية'],
  ['zh-CN', '中文（简体）'],
  ['zh-TW', '中文（繁體）'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['hi', 'हिन्दी'],
  ['tr', 'Türkçe'],
  ['sv', 'Svenska'],
  ['da', 'Dansk'],
  ['no', 'Norsk'],
  ['fi', 'Suomi'],
  ['el', 'Ελληνικά'],
  ['cs', 'Čeština'],
  ['ro', 'Română'],
  ['hu', 'Magyar'],
  ['bg', 'Български'],
  ['hr', 'Hrvatski'],
  ['sk', 'Slovenčina'],
  ['sl', 'Slovenščina'],
  ['lt', 'Lietuvių'],
  ['lv', 'Latviešu'],
  ['et', 'Eesti'],
  ['th', 'ไทย'],
  ['vi', 'Tiếng Việt'],
  ['id', 'Bahasa Indonesia'],
  ['ms', 'Bahasa Melayu'],
  ['fil', 'Filipino'],
  ['he', 'עברית'],
  ['fa', 'فارسی'],
  ['sw', 'Kiswahili'],
];

export default function LanguageSelect() {
  const [val, setVal] = useState('en');

  const pick = (e) => {
    const code = e.target.value;
    setVal(code);

    // Drive the Google widget in place (keeps the session alive)
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
      return;
    }

    // Fallback: classic redirect (only when the widget is unavailable)
    if (code === 'en') return;
    const target = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(
      code,
    )}&u=${encodeURIComponent(window.location.href)}`;
    // Open in a NEW TAB so the signed-in tab never navigates (no logout)
    window.open(target, '_blank', 'noopener');
  };

  return (
    <select className="select lang-select" value={val} onChange={pick} aria-label="Translate page">
      <option value="en">🌐 English</option>
      {LANGS.filter(([c]) => c !== 'en').map(([c, n]) => (
        <option key={c} value={c}>🌐 {n}</option>
      ))}
    </select>
  );
}
