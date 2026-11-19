import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, PublicLayout, RequireRole } from './components/layout.jsx';

// Public
import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import Rates from './pages/public/Rates.jsx';
import Contact from './pages/public/Contact.jsx';
import SignIn from './pages/public/SignIn.jsx';
import Register from './pages/public/Register.jsx';

// Customer app
import Dashboard from './pages/customer/Dashboard.jsx';
import Accounts from './pages/customer/Accounts.jsx';
import Transactions from './pages/customer/Transactions.jsx';
import TransactionDetail from './pages/customer/TransactionDetail.jsx';
import Transfer from './pages/customer/Transfer.jsx';
import Deposit from './pages/customer/Deposit.jsx';
import Beneficiaries from './pages/customer/Beneficiaries.jsx';
import Cards from './pages/customer/Cards.jsx';
import Statements from './pages/customer/Statements.jsx';
import Profile from './pages/customer/Profile.jsx';
import Tickets from './pages/customer/Tickets.jsx';
import TicketDetail from './pages/customer/TicketDetail.jsx';

// Admin console
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminAccounts from './pages/admin/AdminAccounts.jsx';
import AdminDeposits from './pages/admin/AdminDeposits.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminPendingTransfers from './pages/admin/AdminPendingTransfers.jsx';
import AdminNotices from './pages/admin/AdminNotices.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/rates" element={<Rates />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Customer portal — customer role only */}
      <Route element={<RequireRole role="customer" />}>
        <Route path="/app" element={<AppShell role="customer" />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<TransactionDetail />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="deposit" element={<Deposit />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="cards" element={<Cards />} />
          <Route path="statements" element={<Statements />} />
          <Route path="profile" element={<Profile />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
        </Route>
      </Route>

      {/* Admin console — admin role only */}
      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AppShell role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="pending-transfers" element={<AdminPendingTransfers />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
