// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCh0_-NM-rYeXvTmM1cKD8gfc2CpJnVL6E",
  authDomain: "poadcast-42517.firebaseapp.com",
  projectId: "poadcast-42517",
  storageBucket: "poadcast-42517.firebasestorage.app",
  messagingSenderId: "291401169732",
  appId: "1:291401169732:web:88b8545f02711cd7cb3511",
  measurementId: "G-MQMYJSLTVX",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
