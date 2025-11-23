import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyASrLBP5DeXHFAAKp98xV5N_HeOXo4qB-Y",
  authDomain: "zawobook.firebaseapp.com",
  projectId: "zawobook",
  storageBucket: "zawobook.firebasestorage.app",
  messagingSenderId: "125397628624",
  appId: "1:125397628624:web:fb6f2d6781b1658afc10d5",
  measurementId: "G-KEHR11CDCW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
