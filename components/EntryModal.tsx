import React, { useState, useEffect } from 'react';
import { EntryType, LedgerEntry, Settings } from '../types';
import { X, Calendar, DollarSign, Tag, FileText } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<LedgerEntry, 'id' | 'userId' | 'createdAt'> | Omit<LedgerEntry, 'id' | 'userId' | 'createdAt'>[], isEdit?: boolean) => void;
  settings: Settings;
  accounts: { id: string; name: string; type: string; balance: number; createdAt: number }[];
  onAccountsChange: (accounts: { id: string; name: string; type: string; balance: number; createdAt: number }[]) => void;
  defaultAccount?: string | null;
  editEntry?: LedgerEntry | null;
  entries: LedgerEntry[];
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, settings, accounts, onAccountsChange, defaultAccount, editEntry, entries }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [type, setType] = useState<EntryType>(EntryType.CASH_OUT);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const accountNames = accounts.map(acc => acc.name);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [emiCount, setEmiCount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiFrequency, setEmiFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  const generateMonthOptions = () => {
    const months = [];
    let startDate = new Date();
    
    // Find last CASH_IN entry for this account to determine EMI start date
    if (account) {
      const accountCashInEntries = entries.filter(e => e.account === account && e.type === 'CASH_IN');
      if (accountCashInEntries.length > 0) {
        const lastCashIn = accountCashInEntries[0]; // entries are sorted by createdAt desc
        const lastCashInDate = new Date(lastCashIn.date);
        
        // EMI starts next month after last CASH_IN
        if (emiFrequency === 'monthly') {
          startDate = new Date(lastCashInDate.getFullYear(), lastCashInDate.getMonth() + 1, 1);
        } else if (emiFrequency === 'weekly') {
          startDate = new Date(lastCashInDate);
          startDate.setDate(startDate.getDate() + 7);
        } else if (emiFrequency === 'daily') {
          startDate = new Date(lastCashInDate);
          startDate.setDate(startDate.getDate() + 1);
        }
      }
    }
    
    for (let i = 0; i < 12; i++) {
      let date;
      if (emiFrequency === 'monthly') {
        date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      } else if (emiFrequency === 'weekly') {
        date = new Date(startDate);
        date.setDate(date.getDate() + (i * 7));
      } else {
        date = new Date(startDate);
        date.setDate(date.getDate() + i);
      }
      
      const monthKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
      const monthLabel = emiFrequency === 'monthly' 
        ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }
    return months;
  };
  
  const selectedAccount = accounts.find(acc => acc.name === account);
  const isEMIAccount = selectedAccount?.isEMI === true;
  
  console.log('Selected account:', selectedAccount, 'isEMI:', isEMIAccount);

  useEffect(() => {
    if (editEntry && isOpen) {
      setAmount(editEntry.amount.toString());
      setDescription(editEntry.description);
      setCategory(editEntry.category);
      setAccount(editEntry.account);
      setType(editEntry.type);
      setDate(editEntry.date);
    } else if (isOpen) {
      setAccount(defaultAccount || '');
    }
  }, [defaultAccount, editEntry, isOpen]);

  useEffect(() => {
    if (!editEntry) {
      if (account) {
        const accountEntries = entries.filter(e => e.account === account);
        if (accountEntries.length > 0) {
          const lastEntry = accountEntries[0]; // entries are already sorted by createdAt desc
          setDate(lastEntry.date);
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }
        
        // Auto-load EMI amount from last CASH_IN entry
        if (isEMIAccount && type === EntryType.CASH_OUT) {
          const lastCashIn = entries.find(e => e.account === account && e.type === 'CASH_IN');
          if (lastCashIn) {
            // Calculate EMI amount from total amount and EMI count
            const totalAmount = lastCashIn.amount;
            // Try to get EMI count from description or use a default calculation
            const emiCountMatch = lastCashIn.description.match(/EMI\s*(\d+)/i);
            const emiCountFromDesc = emiCountMatch ? parseInt(emiCountMatch[1]) : null;
            
            if (emiCountFromDesc) {
              const calculatedEmiAmount = totalAmount / emiCountFromDesc;
              setEmiAmount(calculatedEmiAmount.toFixed(2));
            }
          }
        }
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [account, editEntry, entries, isEMIAccount, type]);
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { amount, account, description, category, date, type });
    
    if (!amount) {
      console.log('Amount is missing');
      return;
    }
    
    if (!account) {
      console.log('Account is missing');
      return;
    }


    
    // Create multiple entries for EMI CASH_OUT
    if (isEMIAccount && type === EntryType.CASH_OUT && selectedMonths.length > 0 && emiAmount) {
      const emiEntries = selectedMonths.map(monthDate => ({
        amount: parseFloat(emiAmount),
        description: `${description} (EMI Payment)`,
        category: category || 'General',
        account: account,
        date: monthDate,
        type
      }));
      
      console.log('Calling onSave with multiple EMI entries:', emiEntries);
      onSave(emiEntries, !!editEntry);
    } else {
      let finalDescription = description;
      
      // Add EMI info to description for CASH_IN entries
      if (isEMIAccount && type === EntryType.CASH_IN && emiCount && emiAmount) {
        finalDescription = `${description} (EMI ${emiCount} x ${settings.currency.symbol}${emiAmount})`;
      }
      
      const entryData = {
        amount: parseFloat(amount),
        description: finalDescription,
        category: category || 'General',
        account: account,
        date,
        type
      };
      
      console.log('Calling onSave with single entry:', entryData);
      onSave(entryData, !!editEntry);
    }
    
    // Reset
    setAmount('');
    setDescription('');
    setCategory('');
    setAccount('');
    setType(EntryType.CASH_OUT);
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{editEntry ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType(EntryType.CASH_OUT)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                type === EntryType.CASH_OUT 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cash Out
            </button>
            <button
              type="button"
              onClick={() => setType(EntryType.CASH_IN)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                type === EntryType.CASH_IN 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cash In
            </button>
          </div>

          {/* Amount */}
          <div className="relative group">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg font-semibold text-gray-800"
                placeholder={`0.00 ${settings.currency.symbol}`}
              />
            </div>
          </div>

          {/* Description */}
          <div className="relative group">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Grocery Shopping"
              />
            </div>
          </div>

          {/* Account */}
          <div className="relative group">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Account</label>
            <div className="flex gap-2">
              <select
                value={account}
                onChange={e => {
                  if (e.target.value === 'NEW') {
                    setShowNewAccount(true);
                  } else {
                    setAccount(e.target.value);
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select Account</option>
                {accountNames.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
                <option value="NEW">+ Create New Account</option>
              </select>
            </div>
            {showNewAccount && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Account name"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAccountName.trim()) {
                      const newAccount = {
                        id: Date.now().toString() + Math.random().toString(36),
                        name: newAccountName,
                        type: 'checking' as const,
                        balance: 0,
                        createdAt: Date.now()
                      };
                      onAccountsChange([...accounts, newAccount]);
                      setAccount(newAccountName);
                      setNewAccountName('');
                      setShowNewAccount(false);
                    }
                  }}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAccount(false);
                    setNewAccountName('');
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* EMI Fields */}
          {isEMIAccount && type === EntryType.CASH_IN && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">EMI Count</label>
                  <input
                    type="number"
                    value={emiCount}
                    onChange={e => {
                      setEmiCount(e.target.value);
                      if (e.target.value && emiAmount) {
                        setAmount((parseFloat(e.target.value) * parseFloat(emiAmount)).toString());
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Number of EMIs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">EMI Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={emiAmount}
                    onChange={e => {
                      setEmiAmount(e.target.value);
                      if (e.target.value && emiCount) {
                        setAmount((parseFloat(e.target.value) * parseFloat(emiCount)).toString());
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Amount per EMI"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">EMI Frequency</label>
                <select
                  value={emiFrequency}
                  onChange={e => setEmiFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </>
          )}
          
          {/* EMI Month Selection for CASH_OUT */}
          {isEMIAccount && type === EntryType.CASH_OUT && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Select EMI Months</label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {generateMonthOptions().map(month => (
                  <label key={month.key} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newMonths = [...selectedMonths, month.key];
                          setSelectedMonths(newMonths);
                          if (emiAmount) {
                            setAmount((newMonths.length * parseFloat(emiAmount)).toString());
                          }
                        } else {
                          const newMonths = selectedMonths.filter(m => m !== month.key);
                          setSelectedMonths(newMonths);
                          if (emiAmount) {
                            setAmount((newMonths.length * parseFloat(emiAmount)).toString());
                          }
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm">{month.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">EMI Amount per Month</label>
                <input
                  type="number"
                  step="0.01"
                  value={emiAmount}
                  onChange={e => {
                    setEmiAmount(e.target.value);
                    if (e.target.value && selectedMonths.length > 0) {
                      setAmount((selectedMonths.length * parseFloat(e.target.value)).toString());
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Amount per month"
                />
              </div>
              {selectedMonths.length > 0 && emiAmount && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Selected {selectedMonths.length} months × {settings.currency.symbol}{emiAmount} = {settings.currency.symbol}{(selectedMonths.length * parseFloat(emiAmount)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">
                  Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Select Category</option>
                  {settings.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="relative group">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Date</label>
              <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-600"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {editEntry ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EntryModal;