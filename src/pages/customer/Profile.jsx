import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { changePassword, updateProfilePicture } from '../../lib/banking.js';
import { compressAndUploadImage } from '../../lib/uploadImage.js';
import { formatDate } from '../../lib/format.js';
import { Field, Alert, KeyValue, Badge } from '../../components/ui.jsx';

export default function Profile() {
  const { state, currentUser, apply } = useStore();
  const [errors, setErrors] = useState([]);

  const [pw, setPw] = useState({ oldPassword: '', password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState([]);

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
    apply(updateProfilePicture(state, currentUser.id, result.url));
  };
  const setPwField = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  const savePw = (e) => {
    e.preventDefault();
    setPwErrors([]);
    const result = changePassword(state, currentUser.id, pw);
    if (!result.ok) {
      setPwErrors(result.errors);
      return;
    }
    apply(result);
    setPw({ oldPassword: '', password: '', confirm: '' });
  };


  return (
    <>
      <div className="page-title-row">
        <h1>Profile</h1>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">
            Profile details
            {Number(currentUser.status) === 1 ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-16 mg-bottom-16">
            {currentUser.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Profile" style={{ width: 96, height: 96, borderRadius: 999, objectFit: 'cover', border: '2px solid var(--line)' }} />
            ) : (
              <div className="avatar-placeholder">{currentUser.name.charAt(0).toUpperCase()}</div>
            )}
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading…' : currentUser.profilePicture ? 'Change picture' : 'Upload picture'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicture} disabled={uploading} />
            </label>
          </div>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <KeyValue
            items={[
              ['Name', currentUser.name],
              ['Email', currentUser.email],
              ['Phone', `+${currentUser.countryCode} ${currentUser.phone}`],
              ['Account number', currentUser.accountNumber],
              ['Address', currentUser.address || '—'],
            ]}
          />
        </div>

        <div className="card">
          <div className="card-title">Change password</div>
          {pwErrors.length > 0 && <Alert type="error">{pwErrors.join(' ')}</Alert>}
          <form onSubmit={savePw} noValidate>
            <Field label="Old password" required>
              <input className="input" type="password" value={pw.oldPassword} onChange={setPwField('oldPassword')} />
            </Field>
            <Field label="New password" required hint="At least 6 characters.">
              <input className="input" type="password" value={pw.password} onChange={setPwField('password')} />
            </Field>
            <Field label="Confirm new password" required>
              <input className="input" type="password" value={pw.confirm} onChange={setPwField('confirm')} />
            </Field>
            <button className="btn btn-block" type="submit">Change password</button>
          </form>
        </div>
      </div>
    </>
  );
}
