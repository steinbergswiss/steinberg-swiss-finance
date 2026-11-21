// Seed data — 100% sample data.
// No real people, credentials, account numbers or card numbers.
// Passwords are plain text on purpose: this is a client-side app and the
// README explains that a real backend must hash them server-side.

import { daysAgo } from '../lib/format.js';

export const SEED_VERSION = 4;

export function buildSeed() {
  const users = [
    {
      id: 1,
      name: 'Felicitas Steinberg',
      email: 'admin@steinberg.example',
      username: 'f.steinberg',
      accountNumber: '',
      countryCode: '41',
      phone: '000 000 000',
      password: 'steinberg123',
      pin: '1234',
      cotCode: 'COT-123456',
      imfCode: 'IMF-123456',
      swiftCode: 'SSFICHZZXXX',
      userType: 'admin',
      status: 1,
      branchId: 1,
      profilePicture: '',
      emailVerifiedAt: daysAgo(60),
      createdAt: daysAgo(120),
    },
    {
      id: 2,
      name: 'Emma Keller',
      email: 'emma@steinberg.example',
      username: 'emma.keller',
      accountNumber: '9000 0002',
      address: '12 Seefeldstrasse, 8008 Zürich',
      countryCode: '41',
      phone: '079 000 0002',
      password: 'steinberg123',
      pin: '1234',
      cotCode: 'COT-123456',
      imfCode: 'IMF-123456',
      swiftCode: 'SSFICHZZXXX',
      userType: 'customer',
      status: 1,
      branchId: 1,
      profilePicture: '',
      emailVerifiedAt: daysAgo(45),
      allowWithdrawal: 1,
      currencies: [1, 2, 3],
      createdAt: daysAgo(46),
    },
    {
      id: 3,
      name: 'Luca Müller',
      email: 'luca@steinberg.example',
      username: 'luca.muller',
      accountNumber: '9000 0003',
      address: '5 Bahnhofplatz, 8001 Zürich',
      countryCode: '41',
      phone: '079 000 0003',
      password: 'steinberg123',
      pin: '1234',
      cotCode: 'COT-123456',
      imfCode: 'IMF-123456',
      swiftCode: 'SSFICHZZXXX',
      userType: 'customer',
      status: 1,
      branchId: 2,
      profilePicture: '',
      emailVerifiedAt: daysAgo(45),
      allowWithdrawal: 1,
      currencies: [1, 2],
      createdAt: daysAgo(46),
    },
    {
      id: 4,
      name: 'Sofia Rossi',
      email: 'sofia@steinberg.example',
      username: 'sofia.rossi',
      accountNumber: '9000 0004',
      address: '9 Rue du Rhône, 1204 Genève',
      countryCode: '41',
      phone: '079 000 0004',
      password: 'steinberg123',
      pin: '1234',
      cotCode: 'COT-123456',
      imfCode: 'IMF-123456',
      swiftCode: 'SSFICHZZXXX',
      userType: 'customer',
      status: 1,
      branchId: 3,
      profilePicture: '',
      emailVerifiedAt: daysAgo(44),
      allowWithdrawal: 1,
      currencies: [1, 2, 3],
      createdAt: daysAgo(45),
    },
    {
      id: 5,
      name: 'Jonas Weber',
      email: 'jonas@steinberg.example',
      username: 'jonas.weber',
      accountNumber: '9000 0005',
      address: '2 Marktgasse, 3011 Bern',
      countryCode: '41',
      phone: '079 000 0005',
      password: 'steinberg123',
      pin: '1234',
      cotCode: 'COT-123456',
      imfCode: 'IMF-123456',
      swiftCode: 'SSFICHZZXXX',
      userType: 'customer',
      status: 0, // inactive customer, so the admin "users" screen has both states
      branchId: 2,
      profilePicture: '',
      emailVerifiedAt: daysAgo(30),
      allowWithdrawal: 1,
      currencies: [1, 3],
      createdAt: daysAgo(31),
    },
  ];

  const currencies = [
    { id: 1, name: 'GBP', status: 1, rateToBase: 1, symbol: 'GBP' },
    { id: 2, name: 'EUR', status: 1, rateToBase: 1.05, symbol: 'EUR' },
    { id: 3, name: 'USD', status: 1, rateToBase: 1.14, symbol: 'USD' },
  ];

  const branches = [
    { id: 1, name: 'Zürich — Bahnhofstrasse', address: '1 Bahnhofstrasse, 8001 Zürich' },
    { id: 2, name: 'Geneva — Rue du Rhône', address: '2 Rue du Rhône, 1204 Genève' },
    { id: 3, name: 'Bern — Marktgasse', address: '3 Marktgasse, 3011 Bern' },
  ];

  // Transaction statuses follow the PHP script: 0 = rejected, 1 = pending, 2 = completed.
  const T = (
    id, userId, currencyId, amount, fee, drCr, type, status, note, days,
    parentId = null, method = 'Online', bank = null, transactionDetails = null,
  ) => ({
    id, userId, currencyId, amount, fee, drCr, type, method, status, note,
    parentId, bank, createdUserId: null, branchId: 1,
    transactionDetails, createdAt: daysAgo(days), updatedAt: daysAgo(days),
  });

  const transactions = [
    T(1, 2, 1, 25000, 0, 'cr', 'Deposit', 2, 'Opening deposit', 45, null, 'Manual'),
    T(2, 3, 1, 12000, 0, 'cr', 'Deposit', 2, 'Opening deposit', 45, null, 'Manual'),
    T(3, 4, 1, 8800, 0, 'cr', 'Deposit', 2, 'Opening deposit', 45, null, 'Manual'),
    T(4, 5, 1, 4500, 0, 'cr', 'Deposit', 2, 'Opening deposit', 45, null, 'Manual'),
    T(5, 2, 1, 3200, 0, 'cr', 'Deposit', 2, 'Salary — payroll', 25, null, 'Manual'),
    T(6, 2, 1, 850, 0, 'dr', 'Withdraw', 2, 'Rent — Alpine Haus', 18, null, 'Manual'),
    T(7, 2, 2, 1500, 0, 'cr', 'Deposit', 2, 'Opening deposit', 40, null, 'Manual'),
    T(8, 2, 3, 800, 0, 'cr', 'Deposit', 2, 'Opening deposit', 30, null, 'Manual'),
    T(9, 3, 2, 3500, 0, 'cr', 'Deposit', 2, 'Opening deposit', 40, null, 'Manual'),
    T(10, 4, 2, 1200, 0, 'cr', 'Deposit', 2, 'Opening deposit', 38, null, 'Manual'),
    T(11, 4, 3, 2200, 0, 'cr', 'Deposit', 2, 'Opening deposit', 33, null, 'Manual'),
    T(12, 5, 3, 900, 0, 'cr', 'Deposit', 2, 'Opening deposit', 28, null, 'Manual'),
    T(13, 2, 1, 1206, 6, 'dr', 'Transfer', 2, 'Concert tickets repayment', 12),
    T(14, 3, 1, 1200, 0, 'cr', 'Transfer', 2, 'Concert tickets repayment', 12, 13),
    T(15, 2, 1, 502.5, 2.5, 'dr', 'Transfer', 1, 'Shared ski weekend', 1),
    T(16, 3, 1, 500, 0, 'cr', 'Transfer', 1, 'Shared ski weekend', 1, 15),
    T(17, 2, 1, 240, 0, 'dr', 'Payment', 2, 'Card payment — Alpine Sports', 6),
    T(18, 2, 1, 100.5, 0.5, 'dr', 'Transfer', 2, 'Coffee club', 3),
    T(19, 5, 1, 100, 0, 'cr', 'Transfer', 2, 'Coffee club', 3, 18),
    T(20, 3, 1, 400, 0, 'dr', 'Withdraw', 2, 'Cash withdrawal', 9, null, 'Manual'),
    T(21, 4, 2, 60, 0, 'dr', 'Transfer', 2, 'Birthday gift', 5),
    T(22, 2, 2, 60, 0, 'cr', 'Transfer', 2, 'Birthday gift', 5, 21),
    T(23, 5, 3, 130, 0, 'dr', 'Payment', 2, 'Online course', 4),
    T(24, 4, 3, 200, 0, 'dr', 'Withdraw', 2, 'Travel cash', 2, null, 'Manual'),
    T(25, 2, 1, 750, 0, 'cr', 'Deposit', 1, 'Bitcoin deposit', 0, null, 'Bitcoin', null, { txHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' }),
  ];

  const beneficiaries = [
    { id: 1, userId: 2, name: 'Anna Frei', accountNumber: 'SSF-9000 0004', bank: 'Steinberg Swiss Finance', nickname: 'Anna', createdAt: daysAgo(20) },
    { id: 2, userId: 2, name: 'Bruno Graf', accountNumber: 'HC-1122 3344 5566', bank: 'Helvetia Credit Bank', nickname: 'Bruno', createdAt: daysAgo(15) },
    { id: 3, userId: 2, name: 'Claudia Brunner', accountNumber: 'AC-9988 7766 55', bank: 'Alpine Union', nickname: '', createdAt: daysAgo(8) },
    { id: 4, userId: 3, name: 'Emma Keller', accountNumber: 'SSF-9000 0002', bank: 'Steinberg Swiss Finance', nickname: 'Emma', createdAt: daysAgo(10) },
  ];

  const cards = [
    { id: 1, userId: 2, type: 'Debit', network: 'SteinbergPay', pan: '4000 0000 0000 1002', currencyId: 1, expiry: '12/27', status: 'active', createdAt: daysAgo(40) },
    { id: 2, userId: 2, type: 'Platinum', network: 'SteinbergPay', pan: '4000 0000 0000 2002', currencyId: 1, expiry: '06/28', status: 'active', createdAt: daysAgo(20) },
    { id: 3, userId: 3, type: 'Debit', network: 'SteinbergPay', pan: '4000 0000 0000 1003', currencyId: 1, expiry: '03/27', status: 'active', createdAt: daysAgo(39) },
    { id: 4, userId: 4, type: 'Debit', network: 'SteinbergPay', pan: '4000 0000 0000 1004', currencyId: 1, expiry: '09/28', status: 'active', createdAt: daysAgo(38) },
    { id: 5, userId: 5, type: 'Debit', network: 'SteinbergPay', pan: '4000 0000 0000 1005', currencyId: 1, expiry: '11/26', status: 'frozen', createdAt: daysAgo(30) },
  ];

  const tickets = [
    {
      id: 1,
      userId: 2,
      subject: 'Card blocked while travelling',
      status: 0, // 0 pending, 1 active, 2 closed (PHP convention)
      createdUserId: 2,
      operatorId: null,
      closedUserId: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: 2,
      userId: 3,
      subject: 'Question about monthly statement',
      status: 2,
      createdUserId: 3,
      operatorId: 1,
      closedUserId: 1,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(12),
    },
  ];

  const ticketMessages = [
    { id: 1, supportTicketId: 1, message: 'My debit card shows as blocked while I am abroad. This is a message to test the ticket flow.', senderId: 2, createdAt: daysAgo(2) },
    { id: 2, supportTicketId: 2, message: 'How can I export the last three months of my statement?', senderId: 3, createdAt: daysAgo(14) },
    { id: 3, supportTicketId: 2, message: 'Reply: open Statements, pick a date range and use Print / CSV. Everything is sample data.', senderId: 1, createdAt: daysAgo(13) },
    { id: 4, supportTicketId: 2, message: 'Got it, thank you!', senderId: 3, createdAt: daysAgo(12) },
  ];

  const notices = [
    {
      id: 1,
      title: 'Welcome to Steinberg Swiss Finance',
      body: 'Everything in this app is a sample: the bank, the people, the accounts and the cards are all sample data. There is no real money anywhere in this application.',
      status: 1,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: 2,
      title: 'Planned maintenance — Sunday 02:00',
      body: 'In a real deployment this notice would come from the backend CMS. You can edit it from the admin console.',
      status: 1,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  ];

  const settings = {
    site_title: 'Steinberg Swiss Finance',
    company_name: 'Steinberg Swiss Finance AG',
    email: 'support@steinberg.example',
    phone: '+41 00 000 00 00',
    address: '1 Alpenstrasse, 8000 Zürich',
    btc_address: 'bc1qsteinbergswissfinanceexampleaddress000',
    currency_position: 'left',
    date_format: 'd M Y',
    time_format: 'H:i',
    timezone: 'Europe/Zurich',
    allow_signup: 'yes',
    email_verification: 'disabled',
    enable_kyc: 'no',
    mobile_verification: 'disabled',
    transfer_fee_type: 'percentage', // percentage | fixed (PHP get_option keys)
    transfer_fee: '0.5',
    exchange_fee_type: 'percentage',
    exchange_fee: '0',
    send_money_action: '2', // 2 = instant, 1 = needs admin approval (PHP default is instant)
    send_money_otp: '0',
    wire_transfer_otp: '0',
    next_account_number: '9000 0006',
    base_currency: '1',
  };

  return {
    version: SEED_VERSION,
    users,
    currencies,
    branches,
    transactions,
    beneficiaries,
    cards,
    tickets,
    ticketMessages,
    notices,
    contactMessages: [],
    settings,
    counter: {
      user: 6,
      transaction: 26,
      ticket: 3,
      ticketMessage: 5,
      beneficiary: 5,
      card: 6,
      notice: 3,
      contactMessage: 1,
    },
  };
}
