def patch(path, repls):
    s = open(path, encoding='utf-8').read()
    for old, new in repls:
        assert old in s, (path, old[:90])
        s = s.replace(old, new, 1)
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', path)

# ---------- layout: language select + footer removals ----------
patch('src/components/layout.jsx', [
    ("import { Alert } from './ui.jsx';",
     "import { Alert } from './ui.jsx';\nimport LanguageSelect from './LanguageSelect.jsx';"),
    ('''        <div className="header-actions">
          {session ? (''',
     '''        <div className="header-actions">
          <LanguageSelect />
          {session ? ('''),
    ('''            <p className="mg-top-16">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
            </p>
''',
     ''),
    ('              <li><a href="https://brixtemplates.com/more-templates" target="_blank" rel="noreferrer">Browse More Templates</a></li>\n',
     ''),
])

# ---------- Register.jsx: searchable country dropdown ----------
patch('src/pages/public/Register.jsx', [
    ("import { Field, Alert } from '../../components/ui.jsx';",
     "import { Field, Alert } from '../../components/ui.jsx';\nimport CountrySelect from '../../components/CountrySelect.jsx';"),
    ('<input className="input" value={form.countryCode} onChange={set(\'countryCode\')} placeholder="41" />',
     '<CountrySelect value={`+${form.countryCode}`} onChange={(d) => setForm({ ...form, countryCode: d.replace("+", "") })} />'),
])

# ---------- Profile.jsx: searchable country dropdown ----------
patch('src/pages/customer/Profile.jsx', [
    ("import { Field, Alert, KeyValue, Badge } from '../../components/ui.jsx';",
     "import { Field, Alert, KeyValue, Badge } from '../../components/ui.jsx';\nimport CountrySelect from '../../components/CountrySelect.jsx';"),
    ('<input className="input" value={form.countryCode} onChange={set(\'countryCode\')} />',
     '<CountrySelect value={`+${form.countryCode}`} onChange={(d) => setForm({ ...form, countryCode: d.replace("+", "") })} />'),
])

# ---------- AdminUsers.jsx: searchable country dropdown ----------
patch('src/pages/admin/AdminUsers.jsx', [
    ("import { Modal } from '../../components/ui.jsx';",
     "import { Modal } from '../../components/ui.jsx';\nimport CountrySelect from '../../components/CountrySelect.jsx';"),
    ('<input className="input" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />',
     '<CountrySelect value={`+${form.countryCode}`} onChange={(d) => setForm({ ...form, countryCode: d.replace("+", "") })} />'),
])

print('LAYOUT + COUNTRY SELECTS OK')
