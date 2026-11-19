import re

def patch(path, repls):
    s = open(path, encoding='utf-8').read()
    for old, new in repls:
        assert old in s, (path, old[:90])
        s = s.replace(old, new)
    # remove leftover demo badges with surrounding whitespace
    s = re.sub(r'\s*<Badge tone="neutral">demo</Badge>', '', s)
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', path)

# ---------------- seed.js ----------------
patch('src/data/seed.js', [
    ('SEED_VERSION = 1', 'SEED_VERSION = 2'),
    ("password: 'demo1234'", "password: 'steinberg123'"),
    ('admin@steinberg-demo.example', 'admin@steinberg.example'),
    ('emma@steinberg-demo.example', 'emma@steinberg.example'),
    ('luca@steinberg-demo.example', 'luca@steinberg.example'),
    ('sofia@steinberg-demo.example', 'sofia@steinberg.example'),
    ('jonas@steinberg-demo.example', 'jonas@steinberg.example'),
    ("name: 'Zürich — Bahnhofstrasse (demo)'", "name: 'Zürich — Bahnhofstrasse'"),
    ("name: 'Geneva — Rue du Rhône (demo)'", "name: 'Geneva — Rue du Rhône'"),
    ("name: 'Bern — Marktgasse (demo)'", "name: 'Bern — Marktgasse'"),
    ("{ id: 1, name: 'CHF', status: 1, rateToBase: 1, symbol: 'CHF' }", "{ id: 1, name: 'GBP', status: 1, rateToBase: 1, symbol: 'GBP' }"),
    ("'Salary — demo payroll'", "'Salary — payroll'"),
    ("'Card payment — Alpine Sports (demo)'", "'Card payment — Alpine Sports'"),
    ("'Online course (demo)'", "'Online course'"),
    ("bank: 'Helvetia Credit Bank (demo)'", "bank: 'Helvetia Credit Bank'"),
    ("bank: 'Alpine Union (demo)'", "bank: 'Alpine Union'"),
    ("network: 'SteinbergPay (demo)'", "network: 'SteinbergPay'"),
    ("subject: 'Card blocked while travelling (demo)'", "subject: 'Card blocked while travelling'"),
    ("This is a demo message to test the ticket flow.", "This is a message to test the ticket flow."),
    ("'Demo reply: open Statements", "'Reply: open Statements"),
    ("title: 'Welcome to the Steinberg demo'", "title: 'Welcome to Steinberg Swiss Finance'"),
    ("the cards are all demo data. There is no real money anywhere in this application.", "the cards are all fictional data. There is no real money anywhere in this application."),
    ("title: 'Planned maintenance — Sunday 02:00 (demo)'", "title: 'Planned maintenance — Sunday 02:00'"),
    ("In the demo you can edit it from the admin console.", "You can edit it from the admin console."),
    ("email: 'support@steinberg-demo.example'", "email: 'support@steinberg.example'"),
])

# ---------------- format.js ----------------
patch('src/lib/format.js', [
    ("return c ? c.name : 'CHF';", "return c ? c.name : 'GBP';"),
])

# ---------------- banking.js ----------------
patch('src/lib/banking.js', [
    ("note: 'Welcome bonus (demo)'", "note: 'Welcome bonus'"),
    ("message: 'Registration successful. Your demo account is ready.'", "message: 'Registration successful. Your account is ready.'"),
    ("'Card frozen (demo action)'", "'Card frozen'"),
    ("'Card unfrozen (demo action)'", "'Card unfrozen'"),
])

# ---------------- store.jsx ----------------
patch('src/lib/store.jsx', [
    ("'Your account is inactive. Please contact support (demo).'", "'Your account is inactive. Please contact support.'"),
])

# ---------------- layout.jsx ----------------
patch('src/components/layout.jsx', [
    ('support@steinberg-demo.example', 'support@steinberg.example'),
    ('Reset demo', 'Reset data'),
    ("'Admin console — demo'", "'Admin console'"),
    ("'Customer portal — demo'", "'Customer portal'"),
    ("Reset all demo data to the seed state? Your local edits will be lost.", "Reset all data to the seed state? Your local edits will be lost."),
])

# ---------------- admin pages ----------------
patch('src/pages/admin/AdminDashboard.jsx', [
    ("Demo liabilities — {currency.name}", "Liabilities — {currency.name}"),
    ("'CHF is the base currency of the demo.'", "'GBP is the base currency.'"),
])
patch('src/pages/admin/AdminNotices.jsx', [
    ("on the static demo those are collapsed", "on the static site those are collapsed"),
])
patch('src/pages/admin/AdminPendingTransfers.jsx', [
    ("This updates the demo ledger only.", "This updates the ledger only."),
    ("(seeded items shown for the demo)", "(seeded items shown for review)"),
])
patch('src/pages/admin/AdminSettings.jsx', [
    ("Display-only in the demo — no mail can be sent from a static host.", "Display-only — no mail can be sent from a static host."),
    ("Static demo: always off.", "Static site: always off."),
    ("a GitHub Pages demo\n", "a GitHub Pages site\n"),
    ("Left (CHF 1,000.00)", "Left (GBP 1,000.00)"),
    ("Right (1,000.00 CHF)", "Right (1,000.00 GBP)"),
])
patch('src/pages/admin/AdminTransactions.jsx', [
    ("{rows.length} rows — demo ledger", "{rows.length} rows"),
])
patch('src/pages/admin/AdminUsers.jsx', [
    ("Delete demo user ${u.name}? Their demo ledger rows are removed too.", "Delete user ${u.name}? Their ledger rows are removed too."),
])

# ---------------- customer pages ----------------
patch('src/pages/customer/Accounts.jsx', [
    ("Current account — CHF", "Current account — GBP"),
    ("'Account type', 'Current (demo)'", "'Account type', 'Current'"),
])
patch('src/pages/customer/Beneficiaries.jsx', [
    ("Remove this beneficiary? Demo data only.", "Remove this beneficiary?"),
    ("this screen is a demo extension;", "this screen is a showcase extension;"),
    ("Add one to speed up your demo transfers.", "Add one to speed up your transfers."),
    ("e.g. Helvetia Credit Bank (demo).", "e.g. Helvetia Credit Bank."),
])
patch('src/pages/customer/Cards.jsx', [
    ("Masked fake PANs — demo only", "Masked fake PANs"),
    ("This demo account has no cards.", "This account has no cards."),
    ("'Unfreeze' : 'Freeze (demo)'", "'Unfreeze' : 'Freeze'"),
])
patch('src/pages/customer/Profile.jsx', [
    ("Demo passwords are stored in the browser only.", "Passwords are stored in the browser only."),
])
patch('src/pages/customer/Statements.jsx', [
    ("opening demo balance", "opening balance"),
    ("steinberg-demo-statement_", "steinberg-statement_"),
])
patch('src/pages/customer/TicketDetail.jsx', [
    ("Close this ticket? (demo)", "Close this ticket?"),
])
patch('src/pages/customer/Tickets.jsx', [
    ("Attachments are not available in the static demo (PHP allows", "Attachments are not available in the static site (PHP allows"),
])
patch('src/pages/customer/TransactionDetail.jsx', [
    ("it does not belong to your demo account.", "it does not belong to your account."),
    ("otherUser ? otherUser.name : 'Demo customer'", "otherUser ? otherUser.name : 'Customer'"),
])
patch('src/pages/customer/Transfer.jsx', [
    ("Between demo accounts only", "Between accounts only"),
    ("luca@steinberg-demo.example", "luca@steinberg.example"),
    ("Demo rules (ported from PHP)", "Transfer rules (ported from PHP)"),
    ("Recipient must be a demo customer found by email", "Recipient must be a customer found by email"),
])

# ---------------- public pages ----------------
patch('src/pages/public/Home.jsx', [
    ("no monthly fee in this demo.", "no monthly fee."),
    ("support@steinberg-demo.example · info@steinberg-demo.example", "support@steinberg.example · info@steinberg.example"),
    ("Demo: the message is stored in this browser only", "Note: the message is stored in this browser only"),
])
patch('src/pages/public/Contact.jsx', [
    ("support@steinberg-demo.example · info@steinberg-demo.example", "support@steinberg.example · info@steinberg.example"),
    ("Demo: the message is stored in this browser only", "Note: the message is stored in this browser only"),
])
patch('src/pages/public/Register.jsx', [
    ("Sign up is disabled in the demo settings. Ask the admin to enable it.", "Sign up is disabled in the site settings. Ask the admin to enable it."),
    ("Welcome! Your demo account number is", "Welcome! Your account number is"),
    ("Demo: your next account number would be", "Your next account number would be"),
    ("Sign up is disabled in the demo settings. Use the seeded sign-in hints instead.", "Sign up is disabled in the site settings. Use the seeded sign-in hints instead."),
    ("This is a demo — no real agreement is formed.", "This is a showcase — no real agreement is formed."),
    ("Already have a demo account?", "Already have an account?"),
])
patch('src/pages/public/SignIn.jsx', [
    ("const DEMO_ACCOUNTS = [", "const QUICK_ACCOUNTS = ["),
    ("emma@steinberg-demo.example", "emma@steinberg.example"),
    ("luca@steinberg-demo.example", "luca@steinberg.example"),
    ("sofia@steinberg-demo.example", "sofia@steinberg.example"),
    ("admin@steinberg-demo.example", "admin@steinberg.example"),
    ("'demo1234'", "'steinberg123'"),
    ("Signed in to the demo.", "Signed in successfully."),
    ("Demo authentication only — credentials are checked against the fictional seed data in your browser.",
     "Credentials are checked against the fictional seed data in your browser."),
    ("Open a demo account", "Open an account"),
    ("Demo sign-in hints", "Sign-in hints"),
    ("Every password below is <span className=\"text-bold\">demo1234</span>. These are obviously fake,\n              public demo credentials.",
     "Every password below is <span className=\"text-bold\">steinberg123</span>. These are obviously fake,\n              public showcase credentials."),
    ("{DEMO_ACCOUNTS.map(([label, email, pass]) => (", "{QUICK_ACCOUNTS.map(([label, email, pass]) => ("),
])
patch('src/pages/public/Rates.jsx', [
    ("'Current account (CHF)'", "'Current account (GBP)'"),
    ("'Savings account (CHF)'", "'Savings account (GBP)'"),
    ("No monthly fee (demo)", "No monthly fee"),
    ("FX at demo rates", "FX at listed rates"),
    ("Personal loan (demo)", "Personal loan"),
    ("Home loan (demo)", "Home loan"),
    ("Business loan (demo)", "Business loan"),
    ("up to CHF 50,000 (fictional)", "up to GBP 50,000 (fictional)"),
    ("up to CHF 1,000,000 (fictional)", "up to GBP 1,000,000 (fictional)"),
    ("up to CHF 250,000 (fictional)", "up to GBP 250,000 (fictional)"),
    ("Fictional, fixed demo rates. They never move", "Fictional, fixed rates. They never move"),
    ("Internal transfers in this demo are always same-currency", "Internal transfers are always same-currency"),
    ("Lending (display only in this demo)", "Lending (display only)"),
    ("is not part of this demo port", "is not part of this port"),
])

# ---------------- index.html ----------------
patch('index.html', [
    ("Steinberg Swiss Finance online-banking demo. Demonstration only — no real money, accounts, or cards.",
     "Steinberg Swiss Finance online banking."),
    ("Steinberg Swiss Finance — Online Banking Demo", "Steinberg Swiss Finance"),
])

print('ALL PATCHES OK')
