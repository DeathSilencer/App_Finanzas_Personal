import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBduifCpU9Jx4-pRDjSaMWQ-V0POWTKavE",
  authDomain: "controlfinancierosites.firebaseapp.com",
  projectId: "controlfinancierosites",
  storageBucket: "controlfinancierosites.firebasestorage.app",
  messagingSenderId: "10503208933",
  appId: "1:10503208933:web:a00c74bbbeaebdfab2790c",
  measurementId: "G-DT0LYS17JD"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
