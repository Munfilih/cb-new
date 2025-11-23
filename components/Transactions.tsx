import React, { useState, useMemo } from 'react';
import { LedgerEntry, EntryType, Settings } from '../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Search, Tag, Plus } from 'lucide-react';

interface TransactionsProps {
  entries: LedgerEntry[];
  onDelete: (id: string) => void;
  settings: Settings;
  accountFilter?: string | null;
  onClearFilter?: () => void;
  onAddTransaction?: () => void;
  onEdit?: (entry: LedgerEntry) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ entries, onDelete, settings, accountFilter, onClearFilter, onAddTransaction, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CASH_IN' | 'CASH_OUT'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      const matchesSearch = 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || entry.type === filterType;
      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'amount') comparison = a.amount - b.amount;
      else if (sortBy === 'description') comparison = a.description.localeCompare(b.description);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [entries, searchTerm, filterType, sortBy, sortOrder]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-800">Transactions</h2>
              {accountFilter && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Filtered by: {accountFilter}</span>
                  <button 
                    onClick={onClearFilter}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
            {accountFilter && onAddTransaction && (
              <button
                onClick={onAddTransaction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-40 md:w-48"
              />
            </div>
            
            <div className="flex gap-2 min-w-fit">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="px-2 md:px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-w-0 flex-shrink-0"
              >
                <option value="ALL">All</option>
                <option value="CASH_IN">Cash In</option>
                <option value="CASH_OUT">Cash Out</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}
                className="px-2 md:px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-w-0 flex-shrink-0"
              >
                <option value="date-desc">Date ↓</option>
                <option value="date-asc">Date ↑</option>
                <option value="amount-desc">Amount ↓</option>
                <option value="amount-asc">Amount ↑</option>
                <option value="description-asc">Name ↑</option>
                <option value="description-desc">Name ↓</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-3 md:px-4 lg:px-6 py-3 text-left">Description</th>
                <th className="hidden lg:table-cell px-3 md:px-4 lg:px-6 py-3 text-left">Date</th>
                <th className="hidden xl:table-cell px-3 md:px-4 lg:px-6 py-3 text-left">Category</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 text-right">Amount</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onEdit?.(entry)}>
                  <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`p-1.5 md:p-2 rounded-full ${
                        entry.type === EntryType.CASH_IN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {entry.type === EntryType.CASH_IN ? <ArrowDownLeft className="w-3 h-3 md:w-4 md:h-4"/> : <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4"/>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-700 block truncate text-sm md:text-base">{entry.description}</span>
                        <div className="lg:hidden text-xs text-gray-500 mt-1">
                          {new Date(entry.date).toLocaleDateString()} • {entry.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-4 lg:px-6 py-3 md:py-4 text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-4 lg:px-6 py-3 md:py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 gap-1 border border-gray-100">
                      <Tag className="w-3 h-3" />
                      {entry.category}
                    </span>
                  </td>
                  <td className={`px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right font-medium text-sm md:text-base ${
                    entry.type === EntryType.CASH_IN ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <div className="whitespace-nowrap">
                      {entry.type === EntryType.CASH_IN ? '+' : '-'}{settings.currency.symbol}{entry.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(entry.id);
                      }}
                      className="text-gray-400 hover:text-rose-500 p-1.5 md:p-2 rounded-full hover:bg-rose-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;