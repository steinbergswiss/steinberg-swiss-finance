import { useStore } from '../../lib/store.jsx';
import { getSetting } from '../../lib/format.js';
import { Badge } from '../../components/ui.jsx';

const ACCOUNT_TYPES = [
  ['Current account (GBP)', '0.00%', 'No monthly fee', 'Instant internal transfers'],
  ['Savings account (GBP)', '0.50% p.a.', 'No monthly fee', 'Same-day access'],
  ['EUR holdings', '0.25% p.a.', 'No monthly fee', 'FX at listed rates'],
  ['USD holdings', '0.25% p.a.', 'No monthly fee', 'FX at listed rates'],
];

const LOAN_TYPES = [
  ['Personal loan', 'from 4.9% p.a.', 'up to GBP 50,000', '1–5 years'],
  ['Home loan', 'from 2.9% p.a.', 'up to GBP 1,000,000', '5–15 years'],
  ['Business loan', 'from 5.4% p.a.', 'up to GBP 250,000', '1–7 years'],
];

export default function Rates() {
  const { state } = useStore();
  const base = Number(getSetting(state.settings, 'base_currency', '1'));
  const baseCur = state.currencies.find((c) => c.id === base) || state.currencies[0];

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="sufix-line" />
          <h1>Rates</h1>
          <p>Fixed rates. They never move — no market data feeds are involved.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <h2 className="mg-bottom-24">Currency rates</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th className="num">Units per 1 {baseCur.name}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.currencies.map((c) => (
                  <tr key={c.id}>
                    <td className="text-bold">{c.name}</td>
                    <td className="num">{Number(c.rateToBase).toFixed(4)}</td>
                    <td>{c.status === 1 ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="field-hint mg-top-16">
            Internal transfers are always same-currency, so the rates above are informational only.
          </p>

          <h2 className="mg-top-32 mg-bottom-24">Account products</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Interest</th>
                  <th>Fees</th>
                  <th>Features</th>
                </tr>
              </thead>
              <tbody>
                {ACCOUNT_TYPES.map(([a, b, c, d]) => (
                  <tr key={a}>
                    <td className="text-bold">{a}</td>
                    <td>{b}</td>
                    <td>{c}</td>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mg-top-32 mg-bottom-24">Lending (display only)</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {LOAN_TYPES.map(([a, b, c, d]) => (
                  <tr key={a}>
                    <td className="text-bold">{a}</td>
                    <td>{b}</td>
                    <td>{c}</td>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="field-hint mg-top-16">
            The PHP script's loan module is not part of this port — see the README parity list.
          </p>
        </div>
      </section>
    </>
  );
}
