import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { sendContactMessage } from '../../lib/banking.js';
import { Field, Alert } from '../../components/ui.jsx';

import contactIcon1 from '../../assets/img/60e48054528552e62dbab0e8_icon-contact-us-01-banca-template.svg';
import contactIcon2 from '../../assets/img/60e480545285520b7cbab0e9_icon-contact-us-02-banca-template.svg';
import contactIcon3 from '../../assets/img/60e48054528552548bbab0ea_icon-contact-us-03-banca-template.svg';

export default function Contact() {
  const { state, apply } = useStore();
  const [form, setForm] = useState({ name: '', phone: '', email: '', services: '', message: '' });
  const [errors, setErrors] = useState([]);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = sendContactMessage(state, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setSent(true);
    setForm({ name: '', phone: '', email: '', services: '', message: '' });
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="sufix-line" />
          <h1>Get in touch with us<span className="span-primary">.</span></h1>
          <p>Questions about an account, a loan or our services? Send us a message and a member of our team will get back to you within one business day.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="card">
              <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
                <div className="flex gap-16 items-center">
                  <img src={contactIcon1} alt="" style={{ width: 28 }} />
                  <div>
                    <div className="text-bold text-ink">Office</div>
                    <p className="mg-0">1550 Bryant Street STE 750, San Francisco, CA 94103</p>
                  </div>
                </div>
                <div className="flex gap-16 items-center">
                  <img src={contactIcon2} alt="" style={{ width: 28 }} />
                  <div>
                    <div className="text-bold text-ink">Contact</div>
                    <p className="mg-0">support@steinberg.example · info@steinberg.example</p>
                  </div>
                </div>
                <div className="flex gap-16 items-center">
                  <img src={contactIcon3} alt="" style={{ width: 28 }} />
                  <div>
                    <div className="text-bold text-ink">Open Hours</div>
                    <p className="mg-0">Monday - Saturday: 9am - 7pm</p>
                    <p className="mg-0">Sunday: 12am — 6pm</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-accent">
              {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
              {sent && <Alert type="success">Thank you! Your submission has been received!</Alert>}
              <form onSubmit={submit} noValidate>
                <div className="form-grid">
                  <Field label="Name" required>
                    <input className="input" value={form.name} onChange={set('name')} placeholder="What's your name?" />
                  </Field>
                  <Field label="Phone">
                    <input className="input" value={form.phone} onChange={set('phone')} placeholder="(123) 480 - 3540" />
                  </Field>
                </div>
                <Field label="Email" required>
                  <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="What's your email?" />
                </Field>
                <Field label="Service interested in" required>
                  <input className="input" value={form.services} onChange={set('services')} placeholder="Ex. Auto Loan" />
                </Field>
                <Field label="Message">
                  <textarea className="textarea" value={form.message} onChange={set('message')} placeholder="I would like to get in touch with you..." />
                </Field>
                <button className="btn btn-block" type="submit">Send Message</button>
              </form>
              <p className="field-hint mg-top-16">
                Note: the message is stored in this browser only — nothing is emailed anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
