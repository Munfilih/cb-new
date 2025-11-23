import React from 'react';
import { LedgerEntry, Settings } from '../types';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import Transactions from './Transactions';

interface AccountDetailsProps {
  accountName: string;
  entries: LedgerEntry[];
  settings: Settings;
  onBack: () => void;
  onDelete: (id: string) => void;
  onAddTransaction: () => void;
  onEdit?: (entry: LedgerEntry) => void;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ 
  accountName, 
  entries, 
  settings, 
  onBack, 
  onDelete,
  onAddTransaction,
  onEdit 
}) => {
  const accountEntries = entries.filter(entry => entry.account === accountName);
  
  const totalIn = accountEntries
    .filter(e => e.type === 'CASH_IN')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalOut = accountEntries
    .filter(e => e.type === 'CASH_OUT')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const balance = totalOut - totalIn;

  return (
    <div className="space-y-6">


      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Balance: </span>
            <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {settings.currency.symbol}{balance.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            In: {settings.currency.symbol}{totalIn.toFixed(2)} | Out: {settings.currency.symbol}{totalOut.toFixed(2)}
          </div>
        </div>
      </div>

      <Transactions 
        entries={accountEntries}
        onDelete={onDelete}
        settings={settings}
        onEdit={onEdit}
      />
    </div>
  );
};

export default AccountDetails;