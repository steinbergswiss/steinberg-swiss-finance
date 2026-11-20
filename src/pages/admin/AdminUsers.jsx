import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { adminCreateUser, adminDeleteUser, adminUpdateUser } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { Field, Modal, UserStatusBadge, Badge, Alert } from '../../components/ui.jsx';

const EMPTY = {
  name: '',
  email: '',
  username: '',
  accountNumber: '',
  countryCode: '41',
  phone: '',
  branchId: 1,
  status: 1,
  password: '',
  emailVerified: true,
  currencies: [1],
};

export default function AdminUsers() {
  const { state, apply } = useStore();
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);

  const customers = useMemo(
    () =>
      state.users
        .filter((u) => u.userType === 'customer')
        .filter((u) => (filter === 'all' ? true : filter === 'active' ? Number(u.status) === 1 : Number(u.status) === 0))
        .sort((a, b) => b.id - a.id),
    [state.users, filter],
  );

  const branchFor = (id) => state.branches.find((b) => b.id === id)?.name || '—';

  const onPicture = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        setForm({ ...form, profilePicture: canvas.toDataURL('image/jpeg', 0.85) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const open = (u) => {
    setEditing(u || {});
    setForm(
      u
        ? {
            name: u.name,
            email: u.email,
            profilePicture: u.profilePicture || '', 
            username: u.username,
            accountNumber: u.accountNumber,
            countryCode: u.countryCode,
            phone: u.phone,
            branchId: u.branchId,
            status: u.status,
            password: '',
            emailVerified: Boolean(u.emailVerifiedAt),
            currencies: Array.isArray(u.currencies) && u.currencies.length ? [...u.currencies] : [1],
          }
        : EMPTY,
    );
    setErrors([]);
  };

  const save = (e) => {
    e.preventDefault();
    const result = editing?.id
      ? adminUpdateUser(state, editing.id, form)
      : adminCreateUser(state, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setEditing(null);
  };

  const remove = (u) => {
    if (!window.confirm(`Delete user ${u.name}? Their ledger rows are removed too.`)) return;
    apply(adminDeleteUser(state, u.id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Users</h1>
        <button className="btn btn-sm" onClick={() => open(null)}>Add customer</button>
      </div>

      <div className="flex flex-wrap gap-8 mg-bottom-24">
        {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([k, label]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? '' : 'btn-ghost'}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Account</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((u) => (
              <tr key={u.id}>
                <td className="mono">#{u.id}</td>
                <td>
                  <div className="flex items-center gap-8" style={{ gap: 8 }}>
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover' }} />
                    ) : (
                      <span className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: 14, flex: 'none' }}>{u.name.charAt(0).toUpperCase()}</span>
                    )}
                    <span className="text-bold">{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td className="mono">{u.accountNumber}</td>
                <td>+{u.countryCode} {u.phone}</td>
                <td>{branchFor(u.branchId)}</td>
                <td><UserStatusBadge status={u.status} /></td>
                <td className="nowrap">{formatDate(u.createdAt, state.settings)}</td>
                <td className="text-right nowrap">
                  <button className="btn btn-ghost btn-sm" onClick={() => open(u)}>Edit</button>{' '}
                  <button className="btn btn-danger-soft btn-sm" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-hint mg-top-16">
        Ported from the PHP admin UserController: name/email/username/account-number uniqueness, required
        branch & status, password min 6. KYC document verification is stubbed (no uploads on a static host).
      </p>

      {editing && (
        <Modal title={editing.id ? `Edit user #${editing.id}` : 'Add customer'} onClose={() => setEditing(null)} wide>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={save} noValidate>
            <div className="flex items-center gap-12 mg-bottom-16">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="" style={{ width: 72, height: 72, borderRadius: 999, objectFit: 'cover', border: '2px solid var(--line)' }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: 72, height: 72, fontSize: 26 }}>{form.name ? form.name.charAt(0).toUpperCase() : '?'}</div>
              )}
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                {form.profilePicture ? 'Change picture' : 'Upload picture'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicture} />
              </label>
              {form.profilePicture && (
                <button type="button" className="btn-link" onClick={() => setForm({ ...form, profilePicture: '' })}>Remove</button>
              )}
            </div>
            <div className="form-grid">
              <Field label="Name" required>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={255} />
              </Field>
              <Field label="Username" required>
                <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Email" required>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Account number" required hint="Unique, max 30 characters (PHP rule).">
                <input className="input mono" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Country code">
                <input className="input" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Branch" required>
                <select className="select" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: Number(e.target.value) })}>
                  {state.branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status" required>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label={editing?.id ? 'Password (leave blank to keep)' : 'Password'} required={!editing?.id}>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label="Email verified">
                <select className="select" value={form.emailVerified ? 1 : 0} onChange={(e) => setForm({ ...form, emailVerified: Number(e.target.value) === 1 })}>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </Field>
            </div>
            <Field label="Enabled currencies" hint="The customer can hold, view and transfer only these currencies.">
              <div className="flex flex-wrap gap-8">
                {state.currencies.filter((c) => c.status === 1).map((c) => {
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
            </Field>
            <button className="btn btn-block" type="submit">{editing?.id ? 'Save changes' : 'Create customer'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
