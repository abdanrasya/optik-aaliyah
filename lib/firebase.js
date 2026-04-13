import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfwj7S_Y7ZjmPJJ7EGBLRwKK56EOziYXg",
  authDomain: "optik-aaliyah.firebaseapp.com",
  projectId: "optik-aaliyah",
  storageBucket: "optik-aaliyah.firebasestorage.app",
  messagingSenderId: "684062771097",
  appId: "1:684062771097:web:db0296e16f0c6369cf4960",
  measurementId: "G-Y45L0X1MQR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Storage dihapus dari sini biar tidak error