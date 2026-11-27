import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { adminCreateUser, adminDeleteUser, adminUpdateUser } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { compressAndUploadImage } from '../../lib/uploadImage.js';
import { Field, Modal, UserStatusBadge, Badge, Alert } from '../../components/ui.jsx';
import CountrySelect from '../../components/CountrySelect.jsx';

const EMPTY = {
  name: '',
  email: '',
  username: '',
  accountNumber: '',
  countryCode: '41',
  countryIso: 'CH',
  phone: '',
  status: 1,
  password: '',
  pin: '',
  address: '',
  cotCode: '',
  imfCode: '',
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

  const [uploading, setUploading] = useState(false);

  const onPicture = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await compressAndUploadImage(file);
    setUploading(false);
    if (!result.ok) {
      setErrors([result.error]);
      return;
    }
    setForm({ ...form, profilePicture: result.url });
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
            countryIso: u.countryIso || '',
            phone: u.phone,
            status: u.status,
            password: '',
            pin: '',
            address: u.address || '',
            cotCode: u.cotCode || '',
            imfCode: u.imfCode || '',
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
        status, password min 6. KYC document verification is stubbed (no uploads on a static host).
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
                {uploading ? 'Uploading…' : form.profilePicture ? 'Change picture' : 'Upload picture'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicture} disabled={uploading} />
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
                <CountrySelect value={`+${form.countryCode}`} iso={form.countryIso} onChange={(d, c) => setForm({ ...form, countryCode: d.replace("+", ""), countryIso: c })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Address" required>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, postal code" maxLength={500} />
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
              <Field label={editing?.id ? '4-digit passcode (leave blank to keep)' : '4-digit passcode'} required={!editing?.id} hint="Entered after the password at sign-in.">
                <input className="input mono" inputMode="numeric" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" />
              </Field>
              <Field label={editing?.id ? 'COT code (leave blank to keep)' : 'COT code'} required={!editing?.id} hint="Given to the customer by the bank. Required to send international wire transfers.">
                <input className="input mono" value={form.cotCode} onChange={(e) => setForm({ ...form, cotCode: e.target.value })} />
              </Field>
              <Field label={editing?.id ? 'IMF code (leave blank to keep)' : 'IMF code'} required={!editing?.id} hint="Given to the customer by the bank. Required to send international wire transfers.">
                <input className="input mono" value={form.imfCode} onChange={(e) => setForm({ ...form, imfCode: e.target.value })} />
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
