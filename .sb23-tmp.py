def patch(path, repls):
    s = open(path, encoding='utf-8').read()
    for old, new in repls:
        assert old in s, (path, old[:90])
        s = s.replace(old, new, 1)
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', path)

# ---------- banking: registration stores chosen currencies ----------
patch('src/lib/banking.js', [
    ("export function validateRegistration(state, { name, email, countryCode, phone, password, confirm, agree, pin, address }) {",
     "export function validateRegistration(state, { name, email, countryCode, phone, password, confirm, agree, pin, address, currencies }) {"),
    ("  if (!String(address || '').trim()) errors.push('The address field is required.');",
     "  if (!String(address || '').trim()) errors.push('The address field is required.');\n  if (!Array.isArray(currencies) || !currencies.length) errors.push('Please choose at least one currency.');"),
    ("    currencies: [1],\n    createdAt: ts,",
     "    currencies: Array.isArray(form.currencies) && form.currencies.length ? form.currencies.map(Number) : [1],\n    createdAt: ts,"),
])

# ---------- Register: currency checkboxes ----------
patch('src/pages/public/Register.jsx', [
    ("const EMPTY = { name: '', email: '', countryCode: '41', countryIso: 'CH', phone: '', address: '', password: '', confirm: '', pin: '', profilePicture: '', agree: false };",
     "const EMPTY = { name: '', email: '', countryCode: '41', countryIso: 'CH', phone: '', address: '', password: '', confirm: '', pin: '', profilePicture: '', currencies: [1], agree: false };"),
    ('''            <Field label="Your account number" hint="Auto-generated for you — no spaces.">
              <input className="input mono text-bold" value={form.accountNumber} readOnly />
            </Field>''',
     '''            <Field label="Your account number" hint="Auto-generated for you — no spaces.">
              <input className="input mono text-bold" value={form.accountNumber} readOnly />
            </Field>
            <Field label="Currency accounts" required error={errFor('Please choose at least one')} hint="You can hold, send and receive in each selected currency.">
              <div className="flex flex-wrap gap-8">
                {state.currencies
                  .filter((c) => c.status === 1)
                  .map((c) => {
                    const checked = (form.currencies || []).includes(c.id);
                    return (
                      <label key={c.id} className="checkbox-row" style={{ flex: '0 0 auto' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              currencies: checked
                                ? (form.currencies || []).filter((x) => x !== c.id)
                                : [...(form.currencies || []), c.id],
                            })
                          }
                        />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
              </div>
            </Field>'''),
])

# ---------- Wire: drop the third (SWIFT) verification step ----------
patch('src/pages/customer/Wire.jsx', [
    ('''    {
      label: 'Swift Code',
      hint: 'Contact support to provide code',
      expected: () => String(currentUser?.swiftCode || '').trim(),
    },
  ];''',
     '''  ];'''),
    ('''      if (codeStep < 3) {
        // 5 seconds of the spinning SS favicon before the next step
        setLoadingStep(codeStep + 1);
        setTimeout(() => {
          setLoadingStep(0);
          setCodeStep(codeStep + 1);
          setCodeInput('');
        }, 5000);
      } else {
        finishTransfer();
      }''',
     '''      if (codeStep < 2) {
        // 5 seconds of the spinning SS favicon before the next step
        setLoadingStep(codeStep + 1);
        setTimeout(() => {
          setLoadingStep(0);
          setCodeStep(codeStep + 1);
          setCodeInput('');
        }, 5000);
      } else {
        finishTransfer();
      }'''),
    ("              {checking ? (\n                <>\n                  <span className=\"mini-spin\" /> Verifying…\n                </>\n              ) : codeStep === 3 ? (\n                'Verify & send wire transfer'\n              ) : (\n                'Verify & continue'\n              )}",
     "              {checking ? (\n                <>\n                  <span className=\"mini-spin\" /> Verifying…\n                </>\n              ) : codeStep === 2 ? (\n                'Verify & send wire transfer'\n              ) : (\n                'Verify & continue'\n              )}"),
])

print('CURRENCY SIGNUP + 2-STEP WIRE OK')
