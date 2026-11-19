import { Link } from 'react-router-dom';
import aboutImg from '../../assets/img/about.jpg';

const VALUES = [
  ['Customer first', 'Every product starts with a real need. We listen first, then design solutions that fit your life and your business.'],
  ['Passion for service', 'Our teams go the extra mile because we care about the people behind every account, not just the numbers.'],
  ['Commitment', 'We keep our promises: transparent terms, honest advice and support that stays with you long after the account is opened.'],
];

const OFFICES = [
  ['San Francisco', '1550 Bryant Street STE 750 San Francisco, CA 94103'],
  ['London', '944 Queensway South East London SE56 8TD'],
  ['New York', '9469 East Moonlight Drive East Rockaway, NY 11518.'],
];

const YEARS = ['2001', '2003', '2008', '2014', '2018', '2024'];

const JOBS = [
  ['Branch Assistant', 'London', 'Full Time',
    'Be the first point of contact for clients in our London branch — handling day-to-day requests and making every visit a good one.'],
  ['Investment Executive', 'New York', 'Full Time',
    'Support our investment team with research, reporting and client onboarding across the New York office.'],
  ['Support Specialist', 'Remote', 'Part Time',
    'Help customers get the most out of our digital tools, resolving issues quickly and kindly over chat and phone.'],
];

export default function About() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="sufix-line" />
          <h1>At Steinberg Swiss Finance, our goal is to help you grow.</h1>
          <p>Since 2001 we have helped people and businesses plan, save and invest with confidence. Our advisors pair local expertise with Swiss precision — and a genuine commitment to your goals.</p>
          <div className="mg-top-24">
            <Link to="/register" className="btn">Open account</Link>
          </div>
        </div>
      </div>

      {/* Hiring */}
      <section className="section-tight" style={{ background: '#f8f8f8', padding: '48px 0' }}>
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <h2>We’re hiring!</h2>
              <p>We are partnered with top-notch companies worldwide.</p>
              <div className="flex gap-12">
                <Link to="/contact" className="btn btn-secondary">Get in touch</Link>
              </div>
            </div>
            <div className="card">
              <h3>A great place to work, and a great mission to accomplish.</h3>
              <p className="mg-bottom-24">
                We know how hard is it to start something new, that’s why we have the perfect plan for you.
              </p>
              <Link to="/contact" className="btn btn-ghost">Join our team</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="section">
        <div className="container">
          <div className="text-center mg-bottom-32" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
            <div className="sufix-line center" />
            <h2 className="mg-top-16">Our core values<span className="span-primary">.</span></h2>
            <p>Three principles guide everything we do — from opening a first account to financing a growing company.</p>
          </div>
          <div className="grid grid-3">
            {VALUES.map(([title, text]) => (
              <div className="service-card" key={title}>
                <div className="service-title">{title}</div>
                <p className="mg-bottom-16">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global */}
      <section className="section" style={{ background: '#f8f8f8' }}>
        <div className="container">
          <h2 className="text-center">We are a global banking company<span className="span-primary">.</span></h2>
          <p className="text-center" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
            With offices in San Francisco, London and New York, we support clients in over forty countries — combining local knowledge with Swiss reliability.
          </p>
          <div className="grid grid-3">
            {OFFICES.map(([city, addr]) => (
              <div className="stat-box" key={city}>
                <div className="title">{city}</div>
                <div className="value" style={{ fontSize: 15, fontWeight: 600 }}>{addr}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="container">
          <h2 className="text-center">Everyone has a story behind. Here’s ours!</h2>
          <p className="text-center" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
            From a single office in 2001 to a global banking partner, these are the milestones that shaped who we are today.
          </p>
          <div className="grid grid-3">
            {YEARS.map((year) => (
              <div className="service-card" key={year}>
                <div className="service-title text-center">{year}</div>
                <p className="mg-bottom-16">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="section" style={{ background: '#f8f8f8' }}>
        <div className="container">
          <h2 className="text-center">Open positions<span className="span-primary">.</span></h2>
          <p className="text-center" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna.
          </p>
          <div className="grid grid-3">
            {JOBS.map(([role, city, type, text]) => (
              <div className="service-card" key={role}>
                <div className="text-muted" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {city} · {type}
                </div>
                <div className="service-title">{role}</div>
                <p className="mg-bottom-16">{text}</p>
                <Link to="/contact" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>Apply now</Link>
              </div>
            ))}
          </div>
          <div className="text-center mg-top-32">
            <Link to="/contact" className="btn btn-secondary btn-lg" style={{ background: 'transparent' }}>View all positions</Link>
          </div>
        </div>
      </section>

      {/* Reused image strip */}
      <section className="section">
        <div className="container">
          <div className="feature-row">
            <img src={aboutImg} alt="" />
            <div>
              <div className="sufix-line" />
              <h2 className="mg-top-16">We are here to help you grow faster<span className="span-primary">.</span></h2>
              <p>Whether you are opening your first account or scaling a company, our advisors are ready to help you take the next step.</p>
              <Link to="/register" className="btn btn-secondary">Open account</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
