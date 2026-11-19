import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { sendContactMessage } from '../../lib/banking.js';
import { Field, Alert } from '../../components/ui.jsx';

import aboutImg from '../../assets/img/about.jpg';
import heroImage from '../../assets/img/hero-image-banca-template.jpg';
import goal1 from '../../assets/img/goal-1.jpg';
import goal2 from '../../assets/img/goal-2.jpg';
import goal3 from '../../assets/img/goal-3.jpg';
import creditCard from '../../assets/img/credit-card.svg';
import linkArrow from '../../assets/img/link-arrow.svg';

import partner1 from '../../assets/img/60e48054528552131dbab0d9_logo-partners-01-banca-template.svg';
import partner2 from '../../assets/img/60e4805452855226ffbab0da_logo-partners-02-banca-template.svg';
import partner3 from '../../assets/img/60e480545285529e41bab0db_logo-partners-03-banca-template.svg';
import partner4 from '../../assets/img/60e48054528552b903bab0dc_logo-partners-04-banca-template.svg';
import partner5 from '../../assets/img/60e48054528552ab9abab0dd_logo-partners-05-banca-template.svg';

import icon1 from '../../assets/img/60e4805452855278a6bab0c4_icon-services-01-banca-template.svg';
import icon2 from '../../assets/img/60e4805452855299c8bab0c5_icon-services-02-banca-template.svg';
import icon3 from '../../assets/img/60e48054528552593abab0c3_icon-services-03-banca-template.svg';
import icon4 from '../../assets/img/60e480545285522c2cbab0c6_icon-services-04-banca-template.svg';
import icon5 from '../../assets/img/60e4805452855251a7bab0c7_icon-services-05-banca-template.svg';
import icon6 from '../../assets/img/60e48054528552398ebab0c8_icon-services-06-banca-template.svg';

import contactIcon1 from '../../assets/img/60e48054528552e62dbab0e8_icon-contact-us-01-banca-template.svg';
import contactIcon2 from '../../assets/img/60e480545285520b7cbab0e9_icon-contact-us-02-banca-template.svg';
import contactIcon3 from '../../assets/img/60e48054528552548bbab0ea_icon-contact-us-03-banca-template.svg';

import blog4 from '../../assets/img/60e480545285528777bab19b_blog-featured-image-4.jpg';
import blog5 from '../../assets/img/60e480545285526895bab19d_blog-featured-image-5.jpg';
import blog6 from '../../assets/img/60e480545285528e06bab19c_blog-featured-image-6.jpg';

const SERVICES = [
  [icon1, 'Checking accounts', 'Open account', 'A flexible everyday account with instant transfers and no monthly fee.'],
  [icon2, 'Savings accounts', 'Start saving', 'Put money aside with a competitive rate and same-day access when you need it.'],
  [icon3, 'Credit cards', 'Request credit card', 'A card built around your daily life — clear limits and full control from our app.'],
  [icon4, 'Auto Loans', 'Request auto loan', 'Fixed rates and predictable payments to get you behind the wheel sooner.'],
  [icon5, 'Home Loan', 'Request home loan', 'Financing that grows with your plans, from first home to next home.'],
  [icon6, 'Investment accounts', 'Start investing', 'Simple, transparent investing with guidance from our advisors at every step.'],
];

const GOALS = [
  [goal1, 'Students', 'Open an account &\ngrow your credit store'],
  [goal2, 'Local business owners', 'Get a flexible loan\nto start your business'],
  [goal3, 'Entrepreneurs', 'Obtain a credit to take grow your company'],
];

const ARTICLES = [
  [blog4, '5 Tips to choose the right auto loan to buy your next dream car',
    'Choosing the right auto loan can save you thousands. Here are five things to check before you sign.'],
  [blog6, 'When is the perfect moment to apply for a home loan',
    'Timing matters. Learn how to tell when you are financially ready to apply for a home loan.'],
  [blog5, 'How to request a credit line increasement to your bank',
    'A higher credit line can give you flexibility — here is how to request one and what lenders look for.'],
];

export default function Home() {
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
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div>
            <div className="sufix-line" />
            <h1 className="mg-top-16">
              Helping your business grow to the next level<span className="span-primary">.</span>
            </h1>
            <p className="lead">
              From everyday banking to long-term investment, we give people and businesses the tools, advice and confidence to reach their next milestone.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-lg">Open account</Link>
              <Link to="/contact" className="btn btn-secondary btn-lg">Get in touch</Link>
            </div>
          </div>
          <div className="hero-art">
            <img src={heroImage} alt="" />
          </div>
        </div>
      </section>

      {/* Partners */}
      <div className="section-tight">
        <div className="container">
          <div className="flex items-center gap-24" style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div className="text-bold text-ink">Partners</div>
            {[partner1, partner2, partner3, partner4, partner5].map((p, i) => (
              <img key={i} src={p} alt="" style={{ height: 28, opacity: 0.75 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Solutions */}
      <section className="section" style={{ background: '#f8f8f8' }}>
        <div className="container">
          <div className="text-center mg-bottom-32" style={{ maxWidth: 592, margin: '0 auto 40px' }}>
            <div className="sufix-line center" />
            <h2 className="mg-top-16">Solutions for every business need<span className="span-primary">.</span></h2>
          </div>
          <div className="grid grid-3">
            {SERVICES.map(([icon, title, cta, text]) => (
              <div className="service-card" key={title}>
                <img src={icon} alt="" style={{ width: 40, height: 40 }} />
                <div className="service-title">{title}</div>
                <p className="mg-bottom-16">{text}</p>
                <Link to={cta === 'Open account' ? '/register' : '/rates'} className="link-wrapper text-bold" style={{ color: '#0a1023', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{cta}</span>
                  <img src={linkArrow} alt="" style={{ width: 18 }} />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mg-top-32">
            <h3>Need a personalized solution<span className="span-primary">?</span></h3>
            <p>Get in touch with us, and we will help you to create the right one for your business or personal needs.</p>
            <Link to="/contact" className="btn">Customize your plan</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section">
        <div className="container">
          <div className="feature-row">
            <img src={aboutImg} alt="" />
            <div>
              <div className="sufix-line" />
              <h2 className="mg-top-16">We are here to help you grow faster<span className="span-primary">.</span></h2>
              <p className="mg-bottom-32">
                Founded in 2001, Steinberg Swiss Finance has grown from a small local bank into an
                international partner for families and businesses. We combine personal advice with modern
                digital tools.
              </p>
              <Link to="/about" className="btn btn-secondary">About Steinberg Swiss Finance</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Red banner */}
      <section className="section" style={{ background: '#f20823', padding: '64px 0' }}>
        <div className="container text-center">
          <h2 style={{ color: '#fff' }}>Ready to make the leap<span className="span-primary" style={{ color: '#ffd166' }}>?</span><br />Let us help you<span className="span-primary" style={{ color: '#ffd166' }}>.</span></h2>
          <div className="flex items-center" style={{ justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 24 }}>
            <Link to="/register" className="btn btn-lg" style={{ background: '#fff', color: '#f20823', borderColor: '#fff' }}>Open account</Link>
            <Link to="/contact" className="btn btn-secondary btn-lg" style={{ background: 'transparent', borderColor: '#fff', color: '#fff' }}>Get in touch</Link>
          </div>
        </div>
      </section>

      {/* Next goal */}
      <section className="section">
        <div className="container">
          <div className="text-center mg-bottom-32" style={{ maxWidth: 592, margin: '0 auto 40px' }}>
            <div className="sufix-line center" />
            <h2 className="mg-top-16">What is your next goal<span className="span-primary">?</span></h2>
            <p>We know how hard is it to start something new, that’s why we have the perfect plan for you.</p>
          </div>
          <div className="grid grid-3">
            {GOALS.map(([img, sub, title]) => (
              <Link to="/register" className="service-card" style={{ padding: 0, overflow: 'hidden', borderWidth: '1px 1px 4px' }} key={sub}>
                <img src={img} alt="" style={{ width: '100%', height: 210, objectFit: 'cover' }} />
                <div style={{ padding: 22 }}>
                  <div className="text-muted" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {sub}
                  </div>
                  <div className="service-title mg-top-8" style={{ whiteSpace: 'pre-line' }}>{title}</div>
                  <div className="link-wrapper text-bold" style={{ color: '#0a1023', display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                    <span>Learn more</span>
                    <img src={linkArrow} alt="" style={{ width: 18 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Credit card */}
      <section className="section" style={{ background: '#f8f8f8' }}>
        <div className="container">
          <div className="feature-row">
            <img src={creditCard} alt="" style={{ background: '#f20823' }} />
            <div>
              <div className="sufix-line" />
              <h2 className="mg-top-16">Meet our new credit card made for you<span className="span-primary">.</span></h2>
              <p className="mg-bottom-32">
                A card designed around your everyday life — clear rewards, no hidden fees and full control
                from our mobile app, wherever you are.
              </p>
              <Link to="/register" className="btn">Open account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest articles */}
      <section className="section">
        <div className="container">
          <div className="text-center mg-bottom-32" style={{ maxWidth: 592, margin: '0 auto 40px' }}>
            <div className="sufix-line center" />
            <h2 className="mg-top-16">Our latest articles<span className="span-primary">.</span></h2>
            <p>Practical guides, market insights and honest advice from our team — written to help you make better financial decisions.</p>
          </div>
          <div className="grid grid-3">
            {ARTICLES.map(([img, title, text]) => (
              <div className="service-card" style={{ padding: 0, overflow: 'hidden', borderWidth: 1 }} key={title}>
                <img src={img} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                <div style={{ padding: 22 }}>
                  <div className="service-title" style={{ fontSize: 17 }}>{title}</div>
                  <p className="mg-bottom-16" style={{ fontSize: 14.5 }}>{text}</p>
                  <div className="link-wrapper text-bold" style={{ color: '#0a1023', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>Read more</span>
                    <img src={linkArrow} alt="" style={{ width: 18 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mg-top-32">
            <Link to="/about" className="btn btn-secondary btn-lg" style={{ background: 'transparent' }}>See all articles</Link>
          </div>
        </div>
      </section>

      {/* Contact / form section */}
      <section className="section" style={{ background: '#f8f8f8' }}>
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div>
              <div className="sufix-line" />
              <h2 className="mg-top-16">Get in touch with us<span className="span-primary">.</span></h2>
              <p>Have a question about your account or a product? Our team is here to help — send us a message and we will reply within one business day.</p>
              <div className="flex" style={{ flexDirection: 'column', gap: 16, marginTop: 28 }}>
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
                    <p className="mg-0">Monday - Saturday: 9am - 7pm · Sunday: 12am — 6pm</p>
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
