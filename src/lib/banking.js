// Shared banking rules — a direct port of the PHP script's validation and
// posting logic (Customer\TransferController@send_money, RegisterController,
// UserController, ProfileController, SupportTicketController,
// InternalTransferRequestController).
//
// Everything that mutates money lives HERE, not in page components, so the
// same rules are enforced everywhere in the app. This is NOT security:
// client-side checks can be bypassed. A real backend must re-implement these
// rules server-side with authorization on every request.

import { getSetting } from './format.js';

export const STATUS = { rejected: 0, pending: 1, completed: 2 };

const clone = (obj) => structuredClone(obj);

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function nowIso() {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Balances (PHP dashboard SQL):                                      */
/* SUM(cr where status=2) - SUM(dr where status != 0), per currency    */
/* ------------------------------------------------------------------ */
export function balanceFor(state, userId, currencyId) {
  let bal = 0;
  for (const t of state.transactions) {
    if (t.userId !== userId || t.currencyId !== currencyId) continue;
    if (t.drCr === 'cr' && t.status === STATUS.completed) bal += Number(t.amount);
    if (t.drCr === 'dr' && t.status !== STATUS.rejected) bal -= Number(t.amount);
  }
  return round2(bal);
}

export function enabledCurrenciesFor(state, userId) {
  const user = state.users.find((u) => u.id === userId);
  const ids =
    user && Array.isArray(user.currencies) && user.currencies.length
      ? user.currencies
      : state.currencies.filter((c) => c.status === 1).map((c) => c.id);
  return state.currencies.filter((c) => c.status === 1 && ids.includes(c.id));
}

export function balancesForUser(state, userId) {
  return enabledCurrenciesFor(state, userId).map((c) => ({
    currencyId: c.id,
    name: c.name,
    balance: balanceFor(state, userId, c.id),
  }));
}

export function findUserByAccountOrEmail(state, input) {
  const q = String(input || '').trim().toLowerCase();
  if (!q) return null;
  return (
    state.users.find(
      (u) =>
        u.userType === 'customer' &&
        (u.email.toLowerCase() === q ||
          String(u.accountNumber).replace(/\s/g, '').toLowerCase() === q.replace(/\s/g, '')),
    ) || null
  );
}

/* ------------------------------------------------------------------ */
/* Transfer charge (PHP): percentage => fee/100 * amount, fixed => fee */
/* ------------------------------------------------------------------ */
export function transferCharge(state, currencyId, amount) {
  const amountN = Number(amount) || 0;
  const type = getSetting(state.settings, 'transfer_fee_type', 'percentage');
  const fee = Number(getSetting(state.settings, 'transfer_fee', '0')) || 0;
  if (type === 'percentage') return round2((fee / 100) * amountN);
  if (type === 'fixed') return round2(fee);
  return 0;
}

/* ------------------------------------------------------------------ */
/* Internal transfer (send_money) — full PHP port                      */
/* ------------------------------------------------------------------ */
export function validateTransfer(state, { fromUserId, userAccount, currencyId, amount }) {
  const errors = [];
  const from = state.users.find((u) => u.id === fromUserId);
  if (!from) errors.push('Your session is invalid. Please sign in again.');
  if (from && Number(from.allowWithdrawal) === 0) {
    errors.push('Sorry, Withdraw action is disabled in your account !');
  }
  if (!String(userAccount || '').trim()) errors.push('The account number / email field is required.');
  if (!currencyId) errors.push('The currency field is required.');

  const amountN = Number(amount);
  if (String(amount || '').trim() === '' || Number.isNaN(amountN)) {
    errors.push('The amount field is required.');
  } else if (!Number.isFinite(amountN) || amountN < 1) {
    errors.push('The amount must be at least 1.00.');
  }

  if (errors.length) return { ok: false, errors };

  const recipient = findUserByAccountOrEmail(state, userAccount);
  if (!recipient) {
    return { ok: false, errors: ['User Account not found !'] };
  }
  if (recipient.id === fromUserId) {
    return { ok: false, errors: ['You cannot transfer money to your own account.'] };
  }

  const charge = transferCharge(state, currencyId, amountN);
  const available = balanceFor(state, fromUserId, Number(currencyId));
  if (available < amountN + charge) {
    return { ok: false, errors: ['Insufficient balance !'] };
  }
  return { ok: true, recipient, amountN, charge };
}

export function submitTransfer(state, { fromUserId, userAccount, currencyId, amount, note }) {
  const check = validateTransfer(state, { fromUserId, userAccount, currencyId, amount });
  if (!check.ok) return { ok: false, errors: check.errors, state };

  const next = clone(state);
  const { recipient, amountN, charge } = check;
  const currencyIdN = Number(currencyId);
  const from = next.users.find((u) => u.id === fromUserId);
  const status = getSetting(next.settings, 'send_money_action', '2') === '1' ? STATUS.pending : STATUS.completed;

  const debitId = next.counter.transaction++;
  const creditId = next.counter.transaction++;
  const ts = nowIso();
  const noteText = String(note || '').trim() || 'Transfer';

  const debit = {
    id: debitId,
    userId: fromUserId,
    currencyId: currencyIdN,
    amount: round2(amountN + charge),
    fee: round2(charge),
    drCr: 'dr',
    type: 'Transfer',
    method: 'Online',
    status,
    note: noteText,
    parentId: null,
    bank: null,
    createdUserId: fromUserId,
    branchId: 1,
    transactionDetails: null,
    createdAt: ts,
    updatedAt: ts,
  };
  const credit = {
    id: creditId,
    userId: recipient.id,
    currencyId: currencyIdN,
    amount: round2(amountN),
    fee: 0,
    drCr: 'cr',
    type: 'Transfer',
    method: 'Online',
    status,
    note: noteText,
    parentId: debitId,
    bank: null,
    createdUserId: fromUserId,
    branchId: from.branchId,
    transactionDetails: null,
    createdAt: ts,
    updatedAt: ts,
  };
  next.transactions.push(debit, credit);

  const message =
    status === STATUS.pending
      ? 'Transfer Request Submitted. It will deposit recipient account once approved by authority.'
      : 'Money Transferred Successfully';
  return { ok: true, state: next, message, debit, credit, recipient };
}

/* ------------------------------------------------------------------ */
/* Admin: pending internal transfer approve / reject / delete (PHP     */
/* InternalTransferRequestController)                                  */
/* ------------------------------------------------------------------ */
export function pendingTransfers(state) {
  return state.transactions
    .filter((t) => t.drCr === 'dr' && (t.type === 'Transfer' || t.type === 'Exchange') && t.parentId === null)
    .sort((a, b) => b.id - a.id);
}

export function approveTransfer(state, id) {
  const next = clone(state);
  const debit = next.transactions.find((t) => t.id === Number(id) && t.drCr === 'dr');
  if (!debit) return { ok: false, message: 'Transfer not found.', state };
  debit.status = STATUS.completed;
  const credit = next.transactions.find((t) => t.parentId === debit.id && t.drCr === 'cr');
  if (credit) credit.status = STATUS.completed;
  debit.updatedAt = nowIso();
  if (credit) credit.updatedAt = nowIso();
  return { ok: true, message: 'Transfer Request Approved', state: next };
}

export function rejectTransfer(state, id) {
  const next = clone(state);
  const debit = next.transactions.find((t) => t.id === Number(id) && t.drCr === 'dr');
  if (!debit) return { ok: false, message: 'Transfer not found.', state };
  debit.status = STATUS.rejected;
  const credit = next.transactions.find((t) => t.parentId === debit.id && t.drCr === 'cr');
  if (credit) credit.status = STATUS.rejected;
  debit.updatedAt = nowIso();
  if (credit) credit.updatedAt = nowIso();
  return { ok: true, message: 'Transfer Request Rejected', state: next };
}

export function deleteTransfer(state, id) {
  const next = clone(state);
  const debit = next.transactions.find((t) => t.id === Number(id) && t.drCr === 'dr');
  if (!debit) return { ok: false, message: 'Transfer not found.', state };
  next.transactions = next.transactions.filter((t) => t.id !== debit.id && t.parentId !== debit.id);
  return { ok: true, message: 'Deleted Successfully', state: next };
}

/* ------------------------------------------------------------------ */
/* Registration (PHP RegisterController)                               */
/* ------------------------------------------------------------------ */
export function validateRegistration(state, { name, email, countryCode, phone, password, confirm, agree, pin, address, currencies }) {
  const errors = [];
  if (!String(name || '').trim()) errors.push('The name field is required.');
  else if (String(name).length > 191) errors.push('The name may not be greater than 191 characters.');

  if (!String(email || '').trim()) errors.push('The email field is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('The email must be a valid email address.');
  else if (state.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    errors.push('The email has already been taken.');
  }

  if (!String(countryCode || '').trim()) errors.push('The country code field is required.');
  if (!String(phone || '').trim()) errors.push('The phone field is required.');
  else if (state.users.some((u) => u.phone === String(phone).trim())) errors.push('The phone has already been taken.');

  if (!String(password || '')) errors.push('The password field is required.');
  else if (String(password).length < 6) errors.push('The password must be at least 6 characters.');
  if (password !== confirm) errors.push('The password confirmation does not match.');
  if (!agree) errors.push('You must agree with our privacy policy and terms of use');
  if (!String(address || '').trim()) errors.push('The address field is required.');
  if (!Array.isArray(currencies) || !currencies.length) errors.push('Please choose at least one currency.');
  if (!String(pin || '').trim()) errors.push('The passcode field is required.');
  else if (!/^\d{4}$/.test(String(pin).trim())) errors.push('The passcode must be 4 digits.');

  return errors;
}

// Random 10-digit account number (no spaces), unique among users.
export function randomAccountNumber(state) {
  const used = new Set((state.users || []).map((u) => String(u.accountNumber || '')));
  let n;
  do {
    n = String(Math.floor(1000000000 + Math.random() * 9000000000));
  } while (used.has(n));
  return n;
}

export function registerCustomer(state, form) {
  const errors = validateRegistration(state, form);
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);

  // Random 10-digit account number, no spacing (use the form preview when provided)
  const accountNumber = String(form.accountNumber || '').trim() || randomAccountNumber(next);

  const id = next.counter.user++;
  const ts = nowIso();
  const user = {
    id,
    name: String(form.name).trim(),
    email: String(form.email).trim(),
    username: String(form.email).trim().split('@')[0],
    accountNumber,
    countryCode: String(form.countryCode).trim(),
    countryIso: String(form.countryIso || '').trim() || 'CH',
    phone: String(form.phone).trim(),
    address: String(form.address || '').trim(),
    password: String(form.password),
    userType: 'customer',
    status: 1,
    profilePicture: form.profilePicture || '',
    pin: String(form.pin || '').trim(),
    // PHP: email_verified_at = now() when email_verification == 'disabled'
    emailVerifiedAt: getSetting(next.settings, 'email_verification', 'disabled') === 'disabled' ? ts : null,
    allowWithdrawal: 1,
    currencies: Array.isArray(form.currencies) && form.currencies.length ? form.currencies.map(Number) : [1],
    createdAt: ts,
  };
  next.users.push(user);

  // New accounts start at 0. Funds come from admin adjustments or transfers.

  return { ok: true, state: next, user, message: 'Registration successful. Your account is ready.' };
}

/* ------------------------------------------------------------------ */
/* Admin: users (PHP UserController)                                   */
/* ------------------------------------------------------------------ */
export function validateAdminUser(state, form, ignoreId = null) {
  const errors = [];
  const required = (v, msg) => !String(v ?? '').trim() && errors.push(msg);

  required(form.name, 'The name field is required.');
  if (ignoreId === undefined) required(form.address, 'The address field is required.');
  if (String(form.name || '').length > 255) errors.push('The name may not be greater than 255 characters.');
  required(form.email, 'The email field is required.');
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('The email must be a valid email address.');
  if (form.email && state.users.some((u) => u.id !== ignoreId && u.email.toLowerCase() === String(form.email).toLowerCase())) {
    errors.push('The email has already been taken.');
  }
  required(form.username, 'The username field is required.');
  if (form.username && state.users.some((u) => u.id !== ignoreId && u.username === String(form.username).trim())) {
    errors.push('The username has already been taken.');
  }
  required(form.accountNumber, 'The account number field is required.');
  if (form.accountNumber && state.users.some((u) => u.id !== ignoreId && u.accountNumber === String(form.accountNumber).trim())) {
    errors.push('The account number has already been taken.');
  }
  required(form.status, 'The status field is required.');
  if (!ignoreId) {
    required(form.password, 'The password field is required.');
    if (form.password && String(form.password).length < 6) errors.push('The password must be at least 6 characters.');
  } else if (form.password && String(form.password).length < 6) {
    errors.push('The password must be at least 6 characters.');
  }
  return errors;
}

export function adminCreateUser(state, form) {
  const errors = validateAdminUser(state, form);
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const id = next.counter.user++;
  const ts = nowIso();
  next.users.push({
    id,
    name: String(form.name).trim(),
    email: String(form.email).trim(),
    username: String(form.username).trim(),
    accountNumber: form.accountNumber ? String(form.accountNumber).trim() : randomAccountNumber(next),
    countryCode: String(form.countryCode || '').trim(),
    countryIso: String(form.countryIso || '').trim() || 'CH',
    phone: String(form.phone || '').trim(),
    address: String(form.address || '').trim(),
    password: String(form.password),
    userType: 'customer',
    status: Number(form.status),
    profilePicture: form.profilePicture || '',
    emailVerifiedAt: form.emailVerified ? ts : null,
    allowWithdrawal: 1,
    pin: String(form.pin || '').trim(),
    cotCode: String(form.cotCode || '').trim(),
    imfCode: String(form.imfCode || '').trim(),
    swiftCode: String(form.swiftCode || '').trim(),
    currencies: Array.isArray(form.currencies) && form.currencies.length ? form.currencies : [1],
    createdAt: ts,
  });
  return { ok: true, state: next, message: 'User created successfully' };
}

export function adminUpdateUser(state, id, form) {
  const errors = validateAdminUser(state, form, Number(id));
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const user = next.users.find((u) => u.id === Number(id));
  if (!user) return { ok: false, errors: ['User not found.'], state };
  user.name = String(form.name).trim();
  user.email = String(form.email).trim();
  user.username = String(form.username).trim();
  user.accountNumber = String(form.accountNumber).trim();
  if (String(form.address || '').trim()) user.address = String(form.address).trim();
  if (form.countryIso !== undefined) user.countryIso = String(form.countryIso || '').trim() || user.countryIso || 'CH';
  user.countryCode = String(form.countryCode || '').trim();
  user.phone = String(form.phone || '').trim();
  user.status = Number(form.status);
  if (Array.isArray(form.currencies) && form.currencies.length) user.currencies = form.currencies;
  if (form.profilePicture !== undefined) user.profilePicture = form.profilePicture || '';
  if (String(form.pin || '').trim()) user.pin = String(form.pin).trim();
  if (String(form.cotCode || '').trim()) user.cotCode = String(form.cotCode).trim();
  if (String(form.imfCode || '').trim()) user.imfCode = String(form.imfCode).trim();
  if (String(form.swiftCode || '').trim()) user.swiftCode = String(form.swiftCode).trim();
  if (form.password) user.password = String(form.password);
  return { ok: true, state: next, message: 'User updated successfully' };
}

export function adminDeleteUser(state, id) {
  const next = clone(state);
  const user = next.users.find((u) => u.id === Number(id));
  if (!user) return { ok: false, message: 'User not found.', state };
  next.users = next.users.filter((u) => u.id !== Number(id));
  // PHP deletes the user row; related rows are cleaned too
  next.transactions = next.transactions.filter((t) => t.userId !== Number(id));
  next.cards = next.cards.filter((c) => c.userId !== Number(id));
  next.beneficiaries = next.beneficiaries.filter((b) => b.userId !== Number(id));
  return { ok: true, state: next, message: 'User deleted successfully' };
}

/* ------------------------------------------------------------------ */
/* Profile (PHP ProfileController)                                     */
/* ------------------------------------------------------------------ */
export function validateProfile(state, userId, { name, countryCode, phone, email }) {
  const errors = [];
  if (!String(name || '').trim()) errors.push('The name field is required.');
  if (!String(countryCode || '').trim()) errors.push('The country code field is required.');
  if (!String(phone || '').trim()) errors.push('The phone field is required.');
  if (!String(email || '').trim()) errors.push('The email field is required.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('The email must be a valid email address.');
  if (email && state.users.some((u) => u.id !== userId && u.email.toLowerCase() === String(email).toLowerCase())) {
    errors.push('The email has already been taken.');
  }
  return errors;
}

export function updateProfile(state, userId, form) {
  const errors = validateProfile(state, userId, form);
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const user = next.users.find((u) => u.id === userId);
  user.name = String(form.name).trim();
  user.email = String(form.email).trim();
  user.countryCode = String(form.countryCode).trim();
  user.phone = String(form.phone).trim();
  return { ok: true, state: next, message: 'Profile updated successfully' };
}

export function changePassword(state, userId, { oldPassword, password, confirm }) {
  const errors = [];
  const user = state.users.find((u) => u.id === userId);
  if (!String(oldPassword || '')) errors.push('The old password field is required.');
  if (!String(password || '')) errors.push('The new password field is required.');
  else if (String(password).length < 6) errors.push('The password must be at least 6 characters.');
  if (password !== confirm) errors.push('The password confirmation does not match.');
  if (errors.length) return { ok: false, errors, state };
  if (user.password !== oldPassword) {
    return { ok: false, errors: ['Old Password did not match !'], state };
  }
  const next = clone(state);
  next.users.find((u) => u.id === userId).password = String(password);
  return { ok: true, state: next, message: 'Password has been changed' };
}

/* ------------------------------------------------------------------ */
/* Support tickets (PHP SupportTicketController)                       */
/* status: 0 pending, 1 active, 2 closed                               */
/* ------------------------------------------------------------------ */
export function createTicket(state, userId, { subject, message }) {
  const errors = [];
  if (!String(subject || '').trim()) errors.push('The subject field is required.');
  if (!String(message || '').trim()) errors.push('The message field is required.');
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const ts = nowIso();
  const id = next.counter.ticket++;
  const msgId = next.counter.ticketMessage++;
  next.tickets.push({
    id,
    userId,
    subject: String(subject).trim(),
    status: 0,
    createdUserId: userId,
    operatorId: null,
    closedUserId: null,
    createdAt: ts,
    updatedAt: ts,
  });
  next.ticketMessages.push({ id: msgId, supportTicketId: id, message: String(message).trim(), senderId: userId, createdAt: ts });
  return { ok: true, state: next, message: 'New ticket created successfully', ticketId: id };
}

export function replyTicket(state, userId, ticketId, message) {
  if (!String(message || '').trim()) return { ok: false, errors: ['The message field is required.'], state };
  const next = clone(state);
  const ticket = next.tickets.find((t) => t.id === Number(ticketId) && t.userId === userId);
  if (!ticket) return { ok: false, errors: ['Ticket not found.'], state };
  if (ticket.status === 2) return { ok: false, errors: ['Closed tickets cannot be replied to.'], state };
  const id = next.counter.ticketMessage++;
  const ts = nowIso();
  next.ticketMessages.push({ id, supportTicketId: Number(ticketId), message: String(message).trim(), senderId: userId, createdAt: ts });
  ticket.updatedAt = ts;
  return { ok: true, state: next, message: 'Ticket Replied' };
}

export function closeTicket(state, userId, ticketId) {
  const next = clone(state);
  const ticket = next.tickets.find((t) => t.id === Number(ticketId) && t.userId === userId);
  if (!ticket) return { ok: false, message: 'Ticket not found.', state };
  if (ticket.status !== 1) return { ok: false, message: 'Only active tickets can be closed.', state };
  ticket.status = 2;
  ticket.closedUserId = userId;
  ticket.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Ticket Closed' };
}

/* Admin ticket actions */
export function adminReplyTicket(state, adminId, ticketId, message) {
  if (!String(message || '').trim()) return { ok: false, errors: ['The message field is required.'], state };
  const next = clone(state);
  const ticket = next.tickets.find((t) => t.id === Number(ticketId));
  if (!ticket) return { ok: false, errors: ['Ticket not found.'], state };
  if (ticket.status === 2) return { ok: false, errors: ['Closed tickets cannot be replied to.'], state };
  const id = next.counter.ticketMessage++;
  const ts = nowIso();
  next.ticketMessages.push({ id, supportTicketId: Number(ticketId), message: String(message).trim(), senderId: adminId, createdAt: ts });
  // PHP: a staff reply moves a pending ticket into active state
  if (ticket.status === 0) {
    ticket.status = 1;
    ticket.operatorId = adminId;
  }
  ticket.updatedAt = ts;
  return { ok: true, state: next, message: 'Ticket Replied' };
}

export function adminCloseTicket(state, adminId, ticketId) {
  const next = clone(state);
  const ticket = next.tickets.find((t) => t.id === Number(ticketId));
  if (!ticket) return { ok: false, message: 'Ticket not found.', state };
  if (ticket.status === 2) return { ok: false, message: 'Ticket already closed.', state };
  ticket.status = 2;
  ticket.closedUserId = adminId;
  ticket.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Ticket marked as closed' };
}

export function adminDeleteTicket(state, ticketId) {
  const next = clone(state);
  next.tickets = next.tickets.filter((t) => t.id !== Number(ticketId));
  next.ticketMessages = next.ticketMessages.filter((m) => m.supportTicketId !== Number(ticketId));
  return { ok: true, state: next, message: 'Ticket deleted successfully' };
}

/* ------------------------------------------------------------------ */
/* Beneficiaries (saved payees)                                        */
/* ------------------------------------------------------------------ */
export function validateBeneficiary(state, userId, form, ignoreId = null) {
  const errors = [];
  if (!String(form.name || '').trim()) errors.push('The name field is required.');
  if (!String(form.accountNumber || '').trim()) errors.push('The account number field is required.');
  if (ignoreId === undefined && !String(form.pin || '').trim()) errors.push('The passcode field is required.');
  if (ignoreId === undefined && !String(form.cotCode || '').trim()) errors.push('The COT code field is required.');
  if (ignoreId === undefined && !String(form.imfCode || '').trim()) errors.push('The IMF code field is required.');
  if (String(form.pin || '').trim() && !/^\d{4}$/.test(String(form.pin).trim())) errors.push('The passcode must be 4 digits.');
  if (!String(form.bank || '').trim()) errors.push('The bank field is required.');
  return errors;
}

export function saveBeneficiary(state, userId, form, id = null) {
  const errors = validateBeneficiary(state, userId, form, id);
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const ts = nowIso();
  if (id) {
    const b = next.beneficiaries.find((x) => x.id === Number(id) && x.userId === userId);
    if (!b) return { ok: false, errors: ['Beneficiary not found.'], state };
    Object.assign(b, {
      name: String(form.name).trim(),
      accountNumber: String(form.accountNumber).trim(),
      bank: String(form.bank).trim(),
      nickname: String(form.nickname || '').trim(),
    });
  } else {
    next.beneficiaries.push({
      id: next.counter.beneficiary++,
      userId,
      name: String(form.name).trim(),
      accountNumber: String(form.accountNumber).trim(),
      bank: String(form.bank).trim(),
      nickname: String(form.nickname || '').trim(),
      createdAt: ts,
    });
  }
  return { ok: true, state: next, message: id ? 'Beneficiary updated' : 'Beneficiary added' };
}

export function deleteBeneficiary(state, userId, id) {
  const next = clone(state);
  next.beneficiaries = next.beneficiaries.filter((b) => !(b.id === Number(id) && b.userId === userId));
  return { ok: true, state: next, message: 'Beneficiary removed' };
}

/* ------------------------------------------------------------------ */
/* Cards (PANs masked everywhere)                                      */
/* ------------------------------------------------------------------ */
export function toggleCardFreeze(state, userId, cardId) {
  const next = clone(state);
  const card = next.cards.find((c) => c.id === Number(cardId) && c.userId === userId);
  if (!card) return { ok: false, message: 'Card not found.', state };
  card.status = card.status === 'frozen' ? 'active' : 'frozen';
  return {
    ok: true,
    state: next,
    message: card.status === 'frozen' ? 'Card frozen' : 'Card unfrozen',
  };
}

/* ------------------------------------------------------------------ */
/* Notices (PHP "News"/email template concept mapped to in-app notice) */
/* ------------------------------------------------------------------ */
export function saveNotice(state, form, id = null) {
  const errors = [];
  if (!String(form.title || '').trim()) errors.push('The title field is required.');
  if (!String(form.body || '').trim()) errors.push('The body field is required.');
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  const ts = nowIso();
  if (id) {
    const n = next.notices.find((x) => x.id === Number(id));
    if (!n) return { ok: false, errors: ['Notice not found.'], state };
    n.title = String(form.title).trim();
    n.body = String(form.body).trim();
    n.status = Number(form.status);
    n.updatedAt = ts;
  } else {
    next.notices.push({
      id: next.counter.notice++,
      title: String(form.title).trim(),
      body: String(form.body).trim(),
      status: Number(form.status),
      createdAt: ts,
      updatedAt: ts,
    });
  }
  return { ok: true, state: next, message: id ? 'Notice updated' : 'Notice published' };
}

export function deleteNotice(state, id) {
  const next = clone(state);
  next.notices = next.notices.filter((n) => n.id !== Number(id));
  return { ok: true, state: next, message: 'Notice deleted' };
}

/* ------------------------------------------------------------------ */
/* Settings (PHP UtilityController@settings / transactions_fee)        */
/* ------------------------------------------------------------------ */
export function updateSettings(state, patch) {
  const next = clone(state);
  next.settings = { ...next.settings, ...patch };
  return { ok: true, state: next, message: 'Saved successfully' };
}

/* ------------------------------------------------------------------ */
/* Bitcoin deposit requests (settings.btc_address is admin-editable)   */
/* ------------------------------------------------------------------ */
export function bitcoinDeposits(state) {
  return state.transactions
    .filter((t) => t.type === 'Deposit' && t.method === 'Bitcoin' && t.drCr === 'cr')
    .sort((a, b) => b.id - a.id);
}

export function submitBitcoinDeposit(state, { userId, amount, txHash, note }) {
  const errors = [];
  if (String(amount || '').trim() === '' || Number.isNaN(Number(amount))) {
    errors.push('The amount field is required.');
  } else if (Number(amount) < 1) {
    errors.push('The amount must be at least 1.00.');
  }
  if (!String(txHash || '').trim()) errors.push('The transaction ID field is required.');
  if (errors.length) return { ok: false, errors, state };

  const next = clone(state);
  const id = next.counter.transaction++;
  const ts = nowIso();
  const base = Number(getSetting(next.settings, 'base_currency', '1'));
  next.transactions.push({
    id,
    userId,
    currencyId: base,
    amount: round2(Number(amount)),
    fee: 0,
    drCr: 'cr',
    type: 'Deposit',
    method: 'Bitcoin',
    status: STATUS.pending,
    note: String(note || '').trim() || 'Bitcoin deposit',
    parentId: null,
    bank: null,
    createdUserId: userId,
    branchId: 1,
    transactionDetails: { txHash: String(txHash).trim() },
    createdAt: ts,
    updatedAt: ts,
  });
  return {
    ok: true,
    state: next,
    message: 'Deposit request submitted. It will be credited to your account once approved.',
    depositId: id,
  };
}

export function approveDeposit(state, id) {
  const next = clone(state);
  const t = next.transactions.find((x) => x.id === Number(id));
  if (!t) return { ok: false, message: 'Deposit not found.', state };
  t.status = STATUS.completed;
  t.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Deposit Approved' };
}

export function rejectDeposit(state, id) {
  const next = clone(state);
  const t = next.transactions.find((x) => x.id === Number(id));
  if (!t) return { ok: false, message: 'Deposit not found.', state };
  t.status = STATUS.rejected;
  t.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Deposit Rejected' };
}

export function deleteDeposit(state, id) {
  const next = clone(state);
  next.transactions = next.transactions.filter((t) => t.id !== Number(id));
  return { ok: true, state: next, message: 'Deleted Successfully' };
}

/* ------------------------------------------------------------------ */
/* Contact form (PHP WebsiteController@send_message)                   */
/* Stored locally only — no email leaves the browser.                  */
/* ------------------------------------------------------------------ */
export function sendContactMessage(state, { name, email, phone, services, message }) {
  const errors = [];
  if (!String(name || '').trim()) errors.push('The name field is required.');
  if (!String(email || '').trim()) errors.push('The email field is required.');
  if (!String(services || '').trim()) errors.push('The service field is required.');
  if (errors.length) return { ok: false, errors, state };
  const next = clone(state);
  next.contactMessages.push({
    id: next.counter.contactMessage++,
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone || '').trim(),
    services: String(services).trim(),
    message: String(message || '').trim(),
    createdAt: nowIso(),
  });
  return {
    ok: true,
    state: next,
    message: 'Thank you! Your message was recorded in the local store only — nothing was emailed anywhere.',
  };
}


/* ------------------------------------------------------------------ */
/* Admin ledger adjustment (add / subtract funds)                      */
/* ------------------------------------------------------------------ */
export function adminAdjustFunds(state, { userId, currencyId, direction, amount, note, adminId }) {
  const errors = [];
  if (!userId) errors.push('The customer field is required.');
  if (!currencyId) errors.push('The currency field is required.');
  if (String(amount || '').trim() === '' || Number.isNaN(Number(amount))) errors.push('The amount field is required.');
  else if (Number(amount) <= 0) errors.push('The amount must be greater than 0.');
  if (direction !== 'credit' && direction !== 'debit') errors.push('The direction field is required.');
  if (errors.length) return { ok: false, errors, state };

  const next = clone(state);
  const id = next.counter.transaction++;
  const ts = nowIso();
  const amountN = round2(Number(amount));
  next.transactions.push({
    id,
    userId: Number(userId),
    currencyId: Number(currencyId),
    amount: amountN,
    fee: 0,
    drCr: direction === 'credit' ? 'cr' : 'dr',
    type: direction === 'credit' ? 'Deposit' : 'Withdraw',
    method: 'Manual',
    status: STATUS.completed,
    note: String(note || '').trim() || (direction === 'credit' ? 'Balance credit' : 'Balance debit'),
    parentId: null,
    bank: null,
    createdUserId: adminId || null,
    branchId: 1,
    transactionDetails: { adjustedBy: adminId || null },
    createdAt: ts,
    updatedAt: ts,
  });
  return {
    ok: true,
    state: next,
    message: `${direction === 'credit' ? 'Credited' : 'Debited'} ${amountN}`,
  };
}

/* ------------------------------------------------------------------ */
/* Wire transfers (PHP TransferController@wire_transfer +              */
/* TransferRequestController)                                          */
/* ------------------------------------------------------------------ */
export function wireTransfers(state) {
  return state.transactions
    .filter((t) => t.type === 'Wire_Transfer' && t.drCr === 'dr')
    .sort((a, b) => b.id - a.id);
}

export function submitWireTransfer(
  state,
  { userId, bank, swiftCode, currencyId, amount, accountNumber, accountHolderName, note },
) {
  const errors = [];
  if (!String(bank || '').trim()) errors.push('The bank field is required.');
  if (!String(swiftCode || '').trim()) errors.push('The swift code field is required.');
  if (!currencyId) errors.push('The currency field is required.');
  if (String(amount || '').trim() === '' || Number.isNaN(Number(amount))) errors.push('The amount field is required.');
  if (!String(accountNumber || '').trim()) errors.push('The account number field is required.');
  if (!String(accountHolderName || '').trim()) errors.push('The account holder name field is required.');
  if (errors.length) return { ok: false, errors, state };

  const amountN = Number(amount);
  if (amountN < 100 || amountN > 1000000) {
    const currencyNameStr = state.currencies.find((c) => c.id === Number(currencyId))?.name || '';
    return { ok: false, errors: [`Amount must be (${currencyNameStr} 100 - ${currencyNameStr} 1000000)`], state };
  }

  // PHP wire transfer has no charge (charge = 0/100 * amount)
  const available = balanceFor(state, userId, Number(currencyId));
  if (available < amountN) {
    const currencyNameStr = state.currencies.find((c) => c.id === Number(currencyId))?.name || '';
    return { ok: false, errors: [`Insufficient ${currencyNameStr} balance !`], state };
  }

  const next = clone(state);
  const id = next.counter.transaction++;
  const ts = nowIso();
  next.transactions.push({
    id,
    userId,
    currencyId: Number(currencyId),
    amount: round2(amountN),
    fee: 0,
    drCr: 'dr',
    type: 'Wire_Transfer',
    method: 'Manual',
    status: STATUS.pending,
    note: String(note || '').trim() || 'Wire transfer',
    parentId: null,
    bank: String(bank).trim(),
    createdUserId: userId,
    branchId: 1,
    transactionDetails: {
      accountNumber: String(accountNumber).trim(),
      accountHolderName: String(accountHolderName).trim(),
      swiftCode: String(swiftCode).trim(),
    },
    createdAt: ts,
    updatedAt: ts,
  });
  return {
    ok: true,
    state: next,
    message: 'Your wire transfer request was submitted and will be reviewed.',
  };
}

export function approveWire(state, id) {
  const next = clone(state);
  const t = next.transactions.find((x) => x.id === Number(id));
  if (!t) return { ok: false, message: 'Wire transfer not found.', state };
  t.status = STATUS.completed;
  t.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Wire Transfer Approved' };
}

export function rejectWire(state, id) {
  const next = clone(state);
  const t = next.transactions.find((x) => x.id === Number(id));
  if (!t) return { ok: false, message: 'Wire transfer not found.', state };
  t.status = STATUS.rejected;
  t.updatedAt = nowIso();
  return { ok: true, state: next, message: 'Wire Transfer Rejected' };
}

export function deleteWire(state, id) {
  const next = clone(state);
  next.transactions = next.transactions.filter((t) => t.id !== Number(id));
  return { ok: true, state: next, message: 'Deleted Successfully' };
}

/* ------------------------------------------------------------------ */
/* Profile picture                                                     */
/* ------------------------------------------------------------------ */
export function updateProfilePicture(state, userId, dataUrl) {
  const next = clone(state);
  const user = next.users.find((u) => u.id === userId);
  if (!user) return { ok: false, message: 'User not found.', state };
  user.profilePicture = dataUrl || '';
  return { ok: true, state: next, message: 'Profile picture updated' };
}
