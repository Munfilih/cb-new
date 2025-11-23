import React, { useState, useEffect } from 'react';
import { User, LedgerEntry, ViewMode, EntryType, Settings as SettingsType } from './types';

import { storageService } from './services/storageService';

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  createdAt: number;
  isEMI?: boolean;
}
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import EntryModal from './components/EntryModal';
import AccountDetails from './components/AccountDetails';
import { 
  LayoutDashboard, 
  BookOpen,
  List, 
  Plus, 
  Settings as SettingsIcon,
  LogOut, 
  Menu, 
  X,
  ArrowLeft 
} from 'lucide-react';

const defaultSettings: SettingsType = {
  currency: { code: 'USD', symbol: '$', name: 'US Dollar' },
  categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'],
  accountTypes: ['Checking', 'Savings', 'Credit Card', 'Cash']
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  
  const refreshData = async () => {
    if (user) {
      const refreshedEntries = await storageService.getEntries(user.id);
      const refreshedAccounts = await storageService.getAccounts(user.id);
      setEntries(refreshedEntries);
      setAccounts(refreshedAccounts);
      setDebugInfo('Data refreshed');
      setTimeout(() => setDebugInfo(''), 2000);
    }
  };

  useEffect(() => {
    const storedUser = storageService.getCurrentUser();
    
    if (storedUser) {
      setUser(storedUser);
      
      // Load settings
      const loadSettings = async () => {
        try {
          const userSettings = await storageService.getSettings(storedUser.id);
          if (userSettings) {
            setSettings({...defaultSettings, ...userSettings});
          }
        } catch (error) {
          console.error("Failed to fetch settings", error);
        }
      };
      loadSettings();
      
      // Set up real-time listeners
      const unsubscribeEntries = storageService.subscribeToEntries(storedUser.id, setEntries);
      const unsubscribeAccounts = storageService.subscribeToAccounts(storedUser.id, setAccounts);
      
      // Add visibility change listener as fallback for mobile
      const handleVisibilityChange = () => {
        if (!document.hidden && storedUser) {
          refreshData();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        unsubscribeEntries();
        unsubscribeAccounts();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const handleLogin = async (userData: User) => {
    setUser(userData);
    try {
      const userSettings = await storageService.getSettings(userData.id);
      if (userSettings) {
        setSettings({...defaultSettings, ...userSettings});
      }
      setViewMode('DASHBOARD');
    } catch (error) {
      console.error("Failed to fetch data on login", error);
    }
  };

  const handleLogout = () => {
    storageService.logoutUser();
    setUser(null);
    setEntries([]);
  };

  const handleAddEntry = async (entryData: Omit<LedgerEntry, 'id' | 'userId' | 'createdAt'> | Omit<LedgerEntry, 'id' | 'userId' | 'createdAt'>[], isEdit = false) => {
    console.log('handleAddEntry called with:', entryData, 'isEdit:', isEdit);
    
    if (!user) {
      console.log('No user found');
      return;
    }
    
    if (isEdit && editingEntry) {
      const updatedEntry: LedgerEntry = {
        ...entryData,
        id: editingEntry.id,
        userId: user.id,
        createdAt: editingEntry.createdAt
      };
      
      console.log('Updating entry:', updatedEntry);
      try {
        await storageService.addEntry(updatedEntry);
        console.log('Entry updated successfully');
      } catch (error) {
        console.error("Failed to update entry in database", error);
      }
    } else {
      // Handle multiple entries (EMI payments)
      if (Array.isArray(entryData)) {
        console.log('Creating multiple EMI entries:', entryData.length);
        setDebugInfo('Saving EMI entries...');
        try {
          for (const entry of entryData) {
            const newEntry: LedgerEntry = {
              ...entry,
              id: Date.now().toString() + Math.random().toString(36),
              userId: user.id,
              createdAt: Date.now()
            };
            await storageService.addEntry(newEntry);
          }
          console.log('All EMI entries saved successfully');
          setDebugInfo(`${entryData.length} EMI entries saved`);
          setTimeout(() => setDebugInfo(''), 3000);
        } catch (error) {
          console.error("Failed to save EMI entries to database", error);
          setDebugInfo('Save failed: ' + error.message);
          setTimeout(() => setDebugInfo(''), 5000);
        }
      } else {
        // Handle single entry
        const newEntry: LedgerEntry = {
          ...entryData,
          id: Date.now().toString() + Math.random().toString(36),
          userId: user.id,
          createdAt: Date.now()
        };

        console.log('Creating new entry:', newEntry);
        setDebugInfo('Saving entry...');
        try {
          await storageService.addEntry(newEntry);
          console.log('Entry saved successfully');
          setDebugInfo('Entry saved successfully');
          setTimeout(() => setDebugInfo(''), 2000);
        } catch (error) {
          console.error("Failed to save entry to database", error);
          setDebugInfo('Save failed: ' + error.message);
          setTimeout(() => setDebugInfo(''), 5000);
        }
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await storageService.deleteEntry(id);
    } catch (error) {
      console.error("Failed to delete entry from database", error);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const NavItem = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: any; label: string }) => (
    <button
      onClick={() => {
        console.log('NavItem clicked:', label, 'Current mode:', viewMode);
        setSelectedAccount(null);
        setViewMode(mode);
        setIsMobileMenuOpen(false);
        console.log('NavItem set mode to:', mode);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium cursor-pointer relative z-50 ${
        viewMode === mode 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-40">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <LayoutDashboard className="w-5 h-5" />
            </div>
            <span>LedgerKeeper</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem mode="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem mode="ACCOUNTS" icon={BookOpen} label="Accounts" />
          <NavItem mode="TRANSACTIONS" icon={List} label="Transactions" />
          <NavItem mode="SETTINGS" icon={SettingsIcon} label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                 {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                 <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                 <p className="text-xs text-gray-500 truncate">{user.email}</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white border-b border-gray-100 z-20 flex items-center justify-between p-4">
         <div className="flex items-center gap-2 font-bold text-lg text-gray-800">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <LayoutDashboard className="w-4 h-4" />
            </div>
            <span>LedgerKeeper</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
              {isMobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4 space-y-2 animate-fade-in">
             <NavItem mode="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
             <NavItem mode="ACCOUNTS" icon={BookOpen} label="Accounts" />
             <NavItem mode="TRANSACTIONS" icon={List} label="Transactions" />
             <NavItem mode="SETTINGS" icon={SettingsIcon} label="Settings" />
             <hr className="border-gray-100 my-4"/>
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 bg-red-50 rounded-xl">
                <LogOut className="w-5 h-5"/>
                Logout
             </button>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
        {(viewMode === 'DASHBOARD' || viewMode === 'SETTINGS') && (
          <div className="flex justify-between items-center mb-8">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {viewMode === 'DASHBOARD' && 'Dashboard'}
                  {viewMode === 'SETTINGS' && 'Settings'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {viewMode === 'DASHBOARD' && 'Overview of your financial health'}
                  {viewMode === 'SETTINGS' && 'Customize your preferences'}
                </p>
             </div>
             {viewMode === 'DASHBOARD' && (
               <button
                 onClick={() => setIsModalOpen(true)}
                 className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
               >
                 <Plus className="w-5 h-5" />
                 Add Entry
               </button>
             )}
          </div>
        )}

        {viewMode === 'DASHBOARD' && <Dashboard entries={entries} settings={settings} />}
        {viewMode === 'ACCOUNTS' && <Accounts 
          settings={settings} 
          accounts={accounts} 
          entries={entries}
          onAccountsChange={async (newAccounts) => {
            setAccounts(newAccounts);
            if (user && newAccounts.length > accounts.length) {
              const newAccount = newAccounts.find(acc => !accounts.some(existing => existing.id === acc.id));
              if (newAccount) {
                await storageService.saveAccount({...newAccount, userId: user.id});
                // Real-time listener will handle the update
              }
            }
          }}
          onDeleteAccount={async (accountId) => {
            if (user) {
              await storageService.deleteAccount(accountId);
              // Real-time listener will handle the update
            }
          }}
          onViewAccount={(accountName) => {
            setSelectedAccount(accountName);
            setViewMode('ACCOUNT_DETAILS');
          }}
        />}
        {viewMode === 'TRANSACTIONS' && <Transactions 
          entries={selectedAccount ? entries.filter(e => e.account === selectedAccount) : entries} 
          onDelete={handleDeleteEntry} 
          settings={settings}
          accountFilter={selectedAccount}
          onClearFilter={() => setSelectedAccount(null)}
          onAddTransaction={() => setIsModalOpen(true)}
          onEdit={(entry) => {
            setEditingEntry(entry);
            setIsModalOpen(true);
          }}
        />}
        {viewMode === 'SETTINGS' && <Settings settings={settings} onSettingsChange={async (newSettings) => {
          setSettings(newSettings);
          if (user) {
            try {
              await storageService.saveSettings(user.id, newSettings);
            } catch (error) {
              console.error("Failed to save settings", error);
            }
          }
        }} />}
        
        {viewMode === 'ACCOUNT_DETAILS' && selectedAccount && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedAccount(null);
                    setViewMode('ACCOUNTS');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedAccount}</h1>
                  <p className="text-gray-500 text-sm">Account Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Transaction
              </button>
            </div>
            <AccountDetails
              accountName={selectedAccount}
              entries={entries}
              settings={settings}
              onBack={() => {
                setSelectedAccount(null);
                setViewMode('ACCOUNTS');
              }}
              onDelete={handleDeleteEntry}
              onAddTransaction={() => setIsModalOpen(true)}
              onEdit={(entry) => {
                setEditingEntry(entry);
                setIsModalOpen(true);
              }}
            />
          </>
        )}

        {/* FAB for Mobile */}
        {(viewMode === 'DASHBOARD' || viewMode === 'ACCOUNT_DETAILS') && (
          <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-300 hover:bg-indigo-700 transition-colors z-30"
          >
              <Plus className="w-6 h-6" />
          </button>
        )}
      </main>

      {debugInfo && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50">
          {debugInfo}
        </div>
      )}

      <EntryModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }} 
        onSave={handleAddEntry}
        settings={settings}
        accounts={accounts}
        defaultAccount={selectedAccount}
        editEntry={editingEntry}
        entries={entries}
        onAccountsChange={async (newAccounts) => {
          setAccounts(newAccounts);
          if (user && newAccounts.length > accounts.length) {
            const newAccount = newAccounts.find(acc => !accounts.some(existing => existing.id === acc.id));
            if (newAccount) {
              await storageService.saveAccount({...newAccount, userId: user.id});
            }
          }
        }}
      />
    </div>
  );
};

export default App;
