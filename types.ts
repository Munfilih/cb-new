export interface User {
  id: string;
  email: string;
  name: string;
}

export enum EntryType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  account: string;
  date: string; // ISO Date string
  type: EntryType;
  createdAt: number;
}

export type ViewMode = 'DASHBOARD' | 'ACCOUNTS' | 'TRANSACTIONS' | 'SETTINGS' | 'ACCOUNT_DETAILS';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface Settings {
  currency: Currency;
  categories: string[];
  accountTypes: string[];
}

export interface Ledger {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  userId: string;
}
