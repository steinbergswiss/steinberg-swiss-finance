ADD = '''

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
'''

path = 'src/lib/banking.js'
s = open(path, encoding='utf-8').read()
if 'adminAdjustFunds' not in s:
    s += ADD
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('banking.js extended')
else:
    print('already present')
