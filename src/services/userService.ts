// src/services/userService.ts
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  nome?: string;
  cognome?: string; // Campo aggiunto
  qualifica?: string;
  telefono?: string;
  attivo?: boolean;
  squadraId?: string;       // ID della squadra a cui l'utente appartiene
  squadraNome?: string;     // Nome della squadra (es. "SAP-001")  
  // Aggiungi qui altri campi che hai nel tuo documento utente di Firestore se necessario
}

/**
 * Recupera il profilo utente da Firestore, inclusi i dati del ruolo.
 * @param uid L'UID dell'utente autenticato.
 * @returns Il profilo utente o null se non trovato/errore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
    } else {
      console.warn("Nessun profilo utente trovato per l'UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Errore nel recupero del profilo utente:", error);
    return null;
  }
}