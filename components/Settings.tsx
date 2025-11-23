import React, { useState, useEffect } from 'react';
import { Currency, Settings as SettingsType } from '../types';
import { storageService } from '../services/storageService';
import { currencyList } from '../data/currencies';
import { Plus, X } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [showSaved, setShowSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAccountType, setNewAccountType] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    setSelectedCurrency(settings.currency);
  }, [settings.currency]);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        let dbCurrencies = await storageService.getCurrencies();
        if (dbCurrencies.length === 0) {
          await storageService.initializeCurrencies();
          dbCurrencies = await storageService.getCurrencies();
        }
        setCurrencies(dbCurrencies.length > 0 ? dbCurrencies : currencyList);
      } catch (error) {
        console.error('Database error, using local currencies:', error);
        setCurrencies(currencyList);
      }
    };
    loadCurrencies();
  }, []);

  const handleSave = () => {
    onSettingsChange({ ...settings, currency: selectedCurrency });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      const updatedSettings = {
        ...settings,
        categories: [...settings.categories, newCategory.trim()]
      };
      onSettingsChange(updatedSettings);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updatedSettings = {
      ...settings,
      categories: settings.categories.filter(cat => cat !== categoryToRemove)
    };
    onSettingsChange(updatedSettings);
  };

  const handleAddAccountType = () => {
    if (newAccountType.trim() && !settings.accountTypes.includes(newAccountType.trim())) {
      const updatedSettings = {
        ...settings,
        accountTypes: [...settings.accountTypes, newAccountType.trim()]
      };
      onSettingsChange(updatedSettings);
      setNewAccountType('');
    }
  };

  const handleRemoveAccountType = (typeToRemove: string) => {
    const updatedSettings = {
      ...settings,
      accountTypes: settings.accountTypes.filter(type => type !== typeToRemove)
    };
    onSettingsChange(updatedSettings);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={selectedCurrency.code}
            onChange={(e) => {
              const currency = currencies.find(c => c.code === e.target.value);
              if (currency) setSelectedCurrency(currency);
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} - {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((category) => (
                <div key={category} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  <span>{category}</span>
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Types</label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(settings.accountTypes || []).map((type) => (
                <div key={type} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  <span>{type}</span>
                  <button
                    onClick={() => handleRemoveAccountType(type)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new account type"
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccountType()}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button
                onClick={handleAddAccountType}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Save Settings
          </button>
          {showSaved && (
            <span className="text-green-600 text-sm font-medium">Settings saved!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;