
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "API-KEY",
  authDomain: "pomofree-7583f.firebaseapp.com",
  projectId: "pomofree-7583f",
  storageBucket: "pomofree-7583f.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Diğer dosyalardan erişebilmek için auth ve db'yi export etmek için.
export const auth = getAuth(app);
export const db = getFirestore(app);
