import { db } from './firebase';
import { collection, getDocs, query, where, deleteDoc, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { LedgerEntry, User, Currency } from '../types';

const CURRENT_USER_KEY = 'ledger_current_user';

export const storageService = {
  loginUser: async (email: string): Promise<User | null> => {
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data() as User;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      return null;
    }
  },

  saveUser: async (user: User): Promise<void> => {
    try {
      await setDoc(doc(db, "users", user.id), user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    // Keep this sync for fast initial render check
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getEntries: async (userId: string): Promise<LedgerEntry[]> => {
    try {
      const q = query(collection(db, "entries"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const entries: LedgerEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push(doc.data() as LedgerEntry);
      });
      // Sorting client-side to avoid requiring immediate complex index creation
      return entries.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching entries:", error);
      return [];
    }
  },

  addEntry: async (entry: LedgerEntry): Promise<void> => {
    try {
      await setDoc(doc(db, "entries", entry.id), entry);
    } catch (error) {
      console.error("Error adding entry:", error);
      throw error;
    }
  },

  deleteEntry: async (entryId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "entries", entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },

  saveSettings: async (userId: string, settings: any): Promise<void> => {
    try {
      await setDoc(doc(db, "settings", userId), settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  },

  getSettings: async (userId: string): Promise<any | null> => {
    try {
      const docRef = doc(db, "settings", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return null;
    }
  },

  getAccounts: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(db, "accounts"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const accounts: any[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push(doc.data());
      });
      return accounts.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  },

  saveAccount: async (account: any): Promise<void> => {
    try {
      await setDoc(doc(db, "accounts", account.id), account);
    } catch (error) {
      console.error("Error saving account:", error);
      throw error;
    }
  },

  deleteAccount: async (accountId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "accounts", accountId));
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },

  getCurrencies: async (): Promise<Currency[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "currencies"));
      const currencies: Currency[] = [];
      querySnapshot.forEach((doc) => {
        currencies.push(doc.data() as Currency);
      });
      return currencies.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error("Error fetching currencies:", error);
      return [];
    }
  },

  initializeCurrencies: async (): Promise<void> => {
    try {
      const { currencyList } = await import('../data/currencies');
      const batch = [];
      for (const currency of currencyList) {
        batch.push(setDoc(doc(db, "currencies", currency.code), currency));
      }
      await Promise.all(batch);
      console.log('Currencies initialized successfully');
    } catch (error) {
      console.error('Error initializing currencies:', error);
    }
  },

  subscribeToEntries: (userId: string, callback: (entries: any[]) => void) => {
    const q = query(collection(db, "entries"), where("userId", "==", userId));
    return onSnapshot(q, (querySnapshot) => {
      console.log('Entries snapshot received, size:', querySnapshot.size);
      const entries: any[] = [];
      querySnapshot.forEach((doc) => {
        entries.push(doc.data());
      });
      console.log('Entries loaded:', entries.length);
      callback(entries.sort((a, b) => b.createdAt - a.createdAt));
    });
  },

  subscribeToAccounts: (userId: string, callback: (accounts: any[]) => void) => {
    const q = query(collection(db, "accounts"), where("userId", "==", userId));
    return onSnapshot(q, (querySnapshot) => {
      const accounts: any[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push(doc.data());
      });
      callback(accounts.sort((a, b) => b.createdAt - a.createdAt));
    });
  }
};

