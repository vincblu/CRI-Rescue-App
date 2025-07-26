// src/services/userService.ts
import { db } from '../config/firebaseConfig';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore'; // Removed 'where' if not needed here yet

// Interfaccia per il profilo utente come memorizzato in Firestore
export interface UserProfile {
  uid: string; // ID utente di Firebase Authentication
  email: string | null;
  nome: string | null;
  cognome: string | null;
  role: 'user' | 'admin' | null; // Assicurati che questo campo esista e sia coerente
  // ... aggiungi tutti gli altri campi che hai nel documento utente su Firestore
  attivo?: boolean;
  displayName?: string;
  eventoAttivo?: string | null;
  lastActive?: any;
  lastLogin?: any;
  qualifica?: string;
  squadraAssegnata?: string | null;
  telefono?: string;
}

const USERS_COLLECTION = 'users'; // Nome della tua collezione utenti in Firestore

/**
 * Recupera il profilo utente da Firestore dato il suo UID.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile; // Mappa doc.id a uid
    }
    return null;
  } catch (error) {
    console.error('Errore nel recupero del profilo utente:', error);
    throw new Error('Impossibile recuperare il profilo utente.');
  }
};

/**
 * Recupera tutti gli utenti (volontari e admin) da Firestore.
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const q = query(usersCollectionRef); 
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach(docSnap => {
      // CORREZIONE: Mappa correttamente i dati del documento e l'ID
      // doc.data() restituisce i campi del documento. doc.id è l'ID del documento.
      users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile); 
    });
    return users;
  } catch (error) {
    console.error('Errore nel recupero di tutti gli utenti:', error);
    throw new Error('Impossibile recuperare la lista degli utenti.');
  }
};