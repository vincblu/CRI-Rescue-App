// src/services/userService.ts
import { db } from '../config/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// Interfaccia per il profilo utente come memorizzato in Firestore
export interface UserProfile {
  uid: string; // ID utente di Firebase Authentication
  email: string | null;
  nome: string | null;
  cognome: string | null;
  role: 'user' | 'admin' | null;
  // Campi aggiuntivi
  attivo?: boolean;
  displayName?: string;
  eventoAttivo?: string | null;
  squadraAssegnata?: string | null;
  lastActive?: any;
  lastLogin?: any;
  qualifica?: string;
  telefono?: string;
}

/**
 * Interfaccia per volontari disponibili per assegnazione
 */
export interface VolontarioDisponibile extends UserProfile {
  isAssegnato: boolean;
  squadraCorrente?: string;
  nomeSquadraCorrente?: string;
}

const USERS_COLLECTION = 'users';

/**
 * Recupera il profilo utente da Firestore dato il suo UID.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Errore nel recupero del profilo utente:', error);
    throw new Error('Impossibile recuperare il profilo utente.');
  }
};

/**
 * ✅ FUNZIONE MANCANTE: Alias di getUserProfile per compatibilità
 */
export const getUserById = async (uid: string): Promise<UserProfile | null> => {
  return getUserProfile(uid);
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
      users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile); 
    });
    return users;
  } catch (error) {
    console.error('Errore nel recupero di tutti gli utenti:', error);
    throw new Error('Impossibile recuperare la lista degli utenti.');
  }
};

/**
 * Recupera solo utenti attivi
 */
export const getUsersAttivi = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const q = query(usersCollectionRef, where('attivo', '==', true)); 
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach(docSnap => {
      users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile); 
    });

    console.log(`👥 Recuperati ${users.length} utenti attivi`);
    return users;
  } catch (error) {
    console.error('Errore nel recupero utenti attivi:', error);
    throw new Error('Impossibile recuperare gli utenti attivi.');
  }
};

/**
 * Recupera volontari disponibili per assegnazione a squadre
 */
export const getVolontariDisponibili = async (eventoId?: string): Promise<VolontarioDisponibile[]> => {
  try {
    console.log('🔍 Cercando volontari disponibili per evento:', eventoId);

    const utentiAttivi = await getUsersAttivi();
    
    const volontariDisponibili: VolontarioDisponibile[] = utentiAttivi.map(user => {
      const isAssegnato = Boolean(user.squadraAssegnata && user.eventoAttivo);
      const isAssegnatoQuestoEvento = eventoId ? user.eventoAttivo === eventoId : false;

      return {
        ...user,
        isAssegnato,
        squadraCorrente: user.squadraAssegnata || undefined,
        nomeSquadraCorrente: isAssegnato ? `Squadra ${user.squadraAssegnata}` : undefined
      };
    });

    // Ordina: prima non assegnati, poi assegnati ad altri eventi, infine assegnati a questo evento
    volontariDisponibili.sort((a, b) => {
      if (!a.isAssegnato && b.isAssegnato) return -1;
      if (a.isAssegnato && !b.isAssegnato) return 1;
      
      // Se entrambi assegnati, priorità a chi NON è in questo evento
      if (a.isAssegnato && b.isAssegnato) {
        const aInQuestoEvento = a.eventoAttivo === eventoId;
        const bInQuestoEvento = b.eventoAttivo === eventoId;
        
        if (!aInQuestoEvento && bInQuestoEvento) return -1;
        if (aInQuestoEvento && !bInQuestoEvento) return 1;
      }

      // Ordine alfabetico per nome
      return (a.nome || '').localeCompare(b.nome || '');
    });

    console.log(`✅ Trovati ${volontariDisponibili.length} volontari`);
    return volontariDisponibili;

  } catch (error) {
    console.error('❌ Errore recupero volontari disponibili:', error);
    throw new Error('Impossibile recuperare i volontari disponibili.');
  }
};

/**
 * Recupera volontari NON assegnati a nessuna squadra
 */
export const getVolontariLiberi = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersCollectionRef, 
      where('attivo', '==', true),
      where('squadraAssegnata', '==', null)
    ); 
    
    const querySnapshot = await getDocs(q);
    const volontariLiberi: UserProfile[] = [];
    
    querySnapshot.forEach(docSnap => {
      volontariLiberi.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile); 
    });

    console.log(`🆓 Trovati ${volontariLiberi.length} volontari liberi`);
    return volontariLiberi;

  } catch (error) {
    console.error('❌ Errore recupero volontari liberi:', error);
    throw new Error('Impossibile recuperare i volontari liberi.');
  }
};

/**
 * Recupera volontari assegnati a un evento specifico
 */
export const getVolontariPerEvento = async (eventoId: string): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersCollectionRef, 
      where('eventoAttivo', '==', eventoId)
    ); 
    
    const querySnapshot = await getDocs(q);
    const volontari: UserProfile[] = [];
    
    querySnapshot.forEach(docSnap => {
      volontari.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile); 
    });

    console.log(`📋 Trovati ${volontari.length} volontari per evento ${eventoId}`);
    return volontari;

  } catch (error) {
    console.error('❌ Errore recupero volontari per evento:', error);
    throw new Error('Impossibile recuperare i volontari per l\'evento.');
  }
};

/**
 * Aggiorna l'assegnazione squadra/evento per un utente
 */
export const updateUserAssegnazione = async (
  userId: string, 
  squadraId: string | null, 
  eventoId: string | null
): Promise<void> => {
  try {
    console.log('🔄 Aggiornando assegnazione utente:', { userId, squadraId, eventoId });

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      squadraAssegnata: squadraId,
      eventoAttivo: eventoId
    });

    console.log('✅ Assegnazione utente aggiornata');

  } catch (error) {
    console.error('❌ Errore aggiornamento assegnazione:', error);
    throw new Error('Impossibile aggiornare l\'assegnazione dell\'utente.');
  }
};

/**
 * Rimuove assegnazioni per una lista di utenti (batch operation)
 */
export const removeUsersAssegnazioni = async (userIds: string[]): Promise<void> => {
  try {
    console.log('🔄 Rimuovendo assegnazioni per utenti:', userIds);

    const batch = writeBatch(db);

    userIds.forEach(userId => {
      const userRef = doc(db, USERS_COLLECTION, userId);
      batch.update(userRef, {
        squadraAssegnata: null,
        eventoAttivo: null
      });
    });

    await batch.commit();
    console.log('✅ Assegnazioni rimosse con successo');

  } catch (error) {
    console.error('❌ Errore rimozione assegnazioni:', error);
    throw new Error('Impossibile rimuovere le assegnazioni.');
  }
};

/**
 * Ottiene informazioni sulla squadra dell'utente corrente
 */
export const getUserSquadraInfo = async (userId: string): Promise<{
  hasSquadra: boolean;
  squadraId?: string;
  eventoId?: string;
  nomeSquadra?: string;
} | null> => {
  try {
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) return null;

    const hasSquadra = Boolean(userProfile.squadraAssegnata && userProfile.eventoAttivo);

    if (!hasSquadra) {
      return { hasSquadra: false };
    }

    // TODO: Qui potresti fare una query per ottenere il nome effettivo della squadra
    // Per ora ritorniamo un nome generico
    return {
      hasSquadra: true,
      squadraId: userProfile.squadraAssegnata!,
      eventoId: userProfile.eventoAttivo!,
      nomeSquadra: `Squadra ${userProfile.squadraAssegnata}`
    };

  } catch (error) {
    console.error('❌ Errore recupero info squadra utente:', error);
    return null;
  }
};

/**
 * Verifica se un utente ha il ruolo admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('❌ Errore verifica ruolo admin:', error);
    return false;
  }
};

/**
 * Cerca utenti per nome o email
 */
export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  try {
    const allUsers = await getUsersAttivi();
    
    const filtered = allUsers.filter(user => {
      const nome = (user.nome || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const displayName = (user.displayName || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      
      return nome.includes(term) || 
             email.includes(term) || 
             displayName.includes(term);
    });

    console.log(`🔍 Trovati ${filtered.length} utenti per ricerca: "${searchTerm}"`);
    return filtered;

  } catch (error) {
    console.error('❌ Errore ricerca utenti:', error);
    throw new Error('Impossibile cercare gli utenti.');
  }
};