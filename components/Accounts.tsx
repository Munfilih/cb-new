import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { CreditCard, Plus, Wallet, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { storageService } from '../services/storageService';

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  createdAt: number;
  isEMI?: boolean;
}

interface AccountsProps {
  settings: Settings;
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  onDeleteAccount: (accountId: string) => void;
  entries: any[];
  onViewAccount: (accountName: string) => void;
}

const Accounts: React.FC<AccountsProps> = ({ settings, accounts, onAccountsChange, onDeleteAccount, entries, onViewAccount }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking' as Account['type'], balance: 0, isEMI: false });

  const getAccountBalance = (accountName: string) => {
    return entries
      .filter(entry => entry.account === accountName)
      .reduce((balance, entry) => {
        return entry.type === 'CASH_IN' ? balance - entry.amount : balance + entry.amount;
      }, 0);
  };

  const handleCreateAccount = () => {
    if (!newAccount.name.trim()) return;
    
    const account: Account = {
      id: Date.now().toString() + Math.random().toString(36),
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance,
      createdAt: Date.now(),
      isEMI: newAccount.isEMI
    };
    
    onAccountsChange([account, ...accounts]);
    setNewAccount({ name: '', type: 'checking', balance: 0, isEMI: false });
    setShowCreateForm(false);
  };

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    const hasTransactions = entries.some(entry => entry.account === accountName);
    if (hasTransactions) {
      alert('Cannot delete account with existing transactions');
      return;
    }
    
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    onAccountsChange(updatedAccounts);
    onDeleteAccount(accountId);
  };

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'credit': return <CreditCard className="w-5 h-5" />;
      case 'savings': return <Wallet className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Account</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Account name"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <select
              value={newAccount.type}
              onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {(settings.accountTypes || ['Checking', 'Savings', 'Credit']).map(type => (
                <option key={type} value={type.toLowerCase().replace(' ', '')}>{type}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="emiAccount"
                checked={newAccount.isEMI}
                onChange={(e) => setNewAccount(prev => ({ ...prev, isEMI: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="emiAccount" className="text-sm text-gray-700">EMI Account</label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateAccount}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No accounts created yet</p>
            <p className="text-gray-400 text-sm">Create your first account to get started</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                  {getAccountIcon(account.type)}
                </div>
                <button
                  onClick={() => handleDeleteAccount(account.id, account.name)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div onClick={() => onViewAccount(account.name)}>
                <h3 className="font-bold text-gray-900 mb-1">{account.name}</h3>
                <p className="text-sm text-gray-500 mb-3 capitalize">{account.type} Account</p>
                <p className={`text-xl font-bold ${getAccountBalance(account.name) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {settings.currency.symbol}{getAccountBalance(account.name).toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export { Account };
export default Accounts;