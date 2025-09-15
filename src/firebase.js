// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrFrjWxf4pIgdLxXjoUgOgBzsvPcBnUoM",
  authDomain: "pomofree-7583f.firebaseapp.com",
  projectId: "pomofree-7583f",
  storageBucket: "pomofree-7583f.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Diğer dosyalardan erişebilmek için auth ve db'yi export ediyoruz.
export const auth = getAuth(app);
export const db = getFirestore(app);