// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app"; // Importa la funzione initializeApp 
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Le tue credenziali Firebase, prese dalla documentazione 
const firebaseConfig = {
  apiKey: "AIzaSyDor4BC-BdXdhfXeipeLnm111A61sSuDtg", // Chiave API web del tuo progetto Firebase 
  authDomain: "cri-rescue-app.firebaseapp.com",
  projectId: "cri-rescue-app", // ID del tuo progetto Firebase 
  storageBucket: "cri-rescue-app.firebasestorage.app",
  messagingSenderId: "655289838320", // Numero progetto Firebase 
  appId: "1:655289838320:web:cd96353adee92dd63c3035"
};

// Inizializza Firebase con la configurazione specificata 
// const app = initializeApp(firebaseConfig);

// Esporta l'istanza di Firebase per poterla usare in altri moduli della tua app
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);