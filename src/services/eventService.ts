// src/services/eventService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, // <--- Import necessario per getEventById efficiente
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  where,      // <--- IMPORT NECESSARIO per query condizionali (es. getAssegnazioniEvento)
  writeBatch  // <--- IMPORT NECESSARIO per operazioni batch (es. setEventoAttivo, rimozione multipla)
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// --- INTERFACCE ---

export interface EventData {
  nomeEvento: string;
  localita: string;
  dataEvento?: string;
  oraInizio?: string;
  oraFine?: string;
  livello?: 'Low' | 'Medium' | 'High';
  note?: string;
  createdBy: string;
  lastModifiedBy?: string;
  eventoAttivo?: boolean; // Aggiunto per gestione evento attivo (come da tua logica in EventDetailScreen)
  squadreConfigurate?: { id: string; nome: string; maxVolontari: number; }[]; // Aggiunto per le squadre configurate nell'evento
}

export interface Event extends EventData {
  id: string;
  createdAt: any; 
  updatedAt: any; 
}

export interface EventoAssegnazione {
  id: string; // ID del documento di assegnazione in Firestore
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  squadraId: string; // Es. "SAP-001"
  ruolo?: 'volontario' | 'coordinatore'; // Ruolo del volontario all'interno dell'assegnazione
  timestampAssegnazione: any; 
}

export type SquadreRaggruppate = Record<string, EventoAssegnazione[]>;

// Interfaccia per un utente/volontario passato per l'assegnazione (usato in assegnaVolontarioASquadra)
export interface Volontario {
  uid: string;
  nome: string;
  cognome: string;
  email: string;
  role?: string; 
}


// --- NOMI COLLEZIONI ---
const EVENTS_COLLECTION = 'events';
const ASSEGNAZIONI_COLLECTION = 'assegnazioni'; // Collezione per le assegnazioni

// --- FUNZIONI EVENTI ---

/**
 * Crea un nuovo evento
 */
export const createEvent = async (eventData: EventData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Evento creato con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Errore nella creazione evento:', error);
    throw new Error('Impossibile creare l\'evento');
  }
};

/**
 * Recupera tutti gli eventi
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const events: Event[] = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as Event);
    });
    return events;
  } catch (error) {
    console.error('Errore nel recupero eventi:', error);
    throw new Error('Impossibile recuperare gli eventi');
  }
};

/**
 * Aggiorna un evento esistente
 */
export const updateEvent = async (
  eventId: string, 
  updateData: Partial<EventData>
): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    console.log('Evento aggiornato:', eventId);
  } catch (error) {
    console.error('Errore nell\'aggiornamento evento:', error);
    throw new Error('Impossibile aggiornare l\'evento');
  }
};

/**
 * Elimina un evento
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    console.log('Evento eliminato:', eventId);
  } catch (error) {
    console.error('Errore nell\'eliminazione evento:', error);
    throw new Error('Impossibile eliminare l\'evento');
  }
};

/**
 * Recupera un singolo evento per ID (corretto per usare getDoc per efficienza)
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(eventRef); // <--- CORREZIONE: Usa getDoc per ID singolo
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null; 
  } catch (error) {
    console.error('Errore nel recupero evento per ID:', error);
    throw new Error('Impossibile recuperare l\'evento per ID');
  }
};


// --- NUOVE FUNZIONI (necessarie per EventDetailScreen e VolunteerSelectionScreen) ---

/**
 * Imposta un evento come attivo (e disattiva gli altri)
 */
export const setEventoAttivo = async (eventIdToActivate: string): Promise<void> => {
  const batch = writeBatch(db);
  try {
    const activeEventsQuery = query(collection(db, EVENTS_COLLECTION), where('eventoAttivo', '==', true));
    const activeEventsSnapshot = await getDocs(activeEventsQuery);
    activeEventsSnapshot.forEach(docSnap => {
      const eventRef = doc(db, EVENTS_COLLECTION, docSnap.id);
      batch.update(eventRef, { eventoAttivo: false, updatedAt: serverTimestamp() });
    });
    const eventRefToActivate = doc(db, EVENTS_COLLECTION, eventIdToActivate);
    batch.update(eventRefToActivate, { eventoAttivo: true, updatedAt: serverTimestamp() });
    await batch.commit();
    console.log(`Evento ${eventIdToActivate} attivato e altri disattivati.`);
  } catch (error) {
    console.error('Errore nell\'attivazione evento:', error);
    throw new Error('Impossibile attivare l\'evento. Verifica le regole di sicurezza.');
  }
};

/**
 * Recupera tutte le assegnazioni per un evento specifico.
 */
export const getAssegnazioniEvento = async (eventId: string): Promise<EventoAssegnazione[]> => {
  try {
    const q = query(collection(db, ASSEGNAZIONI_COLLECTION), where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    const assegnazioni: EventoAssegnazione[] = [];
    querySnapshot.forEach((docSnap) => {
      assegnazioni.push({ id: docSnap.id, ...docSnap.data() } as EventoAssegnazione);
    });
    return assegnazioni;
  } catch (error) {
    console.error("Errore nel recupero delle assegnazioni per l'evento:", error);
    throw new Error('Impossibile recuperare le assegnazioni.');
  }
};

/**
 * Raggruppa le assegnazioni per ID squadra per un evento specifico.
 */
export const getSquadreConAssegnazioni = async (eventId: string): Promise<SquadreRaggruppate> => {
  try {
    const assegnazioni = await getAssegnazioniEvento(eventId);
    const squadreRaggruppate: SquadreRaggruppate = {};
    assegnazioni.forEach(assegnazione => {
      if (!squadreRaggruppate[assegnazione.squadraId]) {
        squadreRaggruppate[assegnazione.squadraId] = [];
      }
      squadreRaggruppate[assegnazione.squadraId].push(assegnazione);
    });
    const sortedSquadre: SquadreRaggruppate = {};
    Object.keys(squadreRaggruppate).sort().forEach(key => {
      sortedSquadre[key] = squadreRaggruppate[key];
    });
    return sortedSquadre;
  } catch (error) {
    console.error("Errore nel raggruppamento delle squadre con assegnazioni:", error);
    throw new Error('Impossibile raggruppare le squadre con assegnazioni.');
  }
};

/**
 * Configura squadre standard per un evento (crea/aggiorna campo nell'evento).
 * Crea un array di oggetti squadra e lo salva nel campo 'squadreConfigurate' dell'evento.
 */
export const configuraSquadreStandard = async (eventId: string, numeroSquadre: number): Promise<void> => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  const squadreConfigurate: { id: string; nome: string; maxVolontari: number; }[] = [];
  for (let i = 1; i <= numeroSquadre; i++) {
    const squadraId = `SAP-${String(i).padStart(3, '0')}`;
    squadreConfigurate.push({
      id: squadraId,
      nome: squadraId,
      maxVolontari: 4, 
    });
  }
  try {
    await updateDoc(eventRef, { 
        squadreConfigurate: squadreConfigurate,
        updatedAt: serverTimestamp()
    });
    console.log(`Configurate ${numeroSquadre} squadre standard per l'evento ${eventId}`);
  } catch (error) {
    console.error("Errore durante la configurazione delle squadre standard:", error);
    throw new Error('Impossibile configurare le squadre standard.');
  }
};

/**
 * Assegna un volontario a una squadra per un evento.
 */
export const assegnaVolontarioASquadra = async (
  eventId: string, 
  squadraId: string, 
  volontario: Volontario
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ASSEGNAZIONI_COLLECTION), {
      eventId: eventId,
      squadraId: squadraId,
      userId: volontario.uid,
      userName: `${volontario.nome} ${volontario.cognome}`,
      userEmail: volontario.email,
      timestampAssegnazione: serverTimestamp(),
    });
    console.log(`Volontario ${volontario.email} assegnato alla squadra ${squadraId} nell'evento ${eventId}`);
    return docRef.id;
  } catch (error) {
    console.error("Errore nell'assegnazione del volontario alla squadra:", error);
    throw new Error("Impossibile assegnare il volontario alla squadra.");
  }
};

/**
 * Rimuove un volontario da un'assegnazione specifica per un evento.
 * Richiede l'ID del documento di assegnazione da eliminare.
 */
export const rimuoviVolontarioDaAssegnazione = async (assegnazioneId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ASSEGNAZIONI_COLLECTION, assegnazioneId));
    console.log(`Assegnazione ${assegnazioneId} rimossa.`);
  } catch (error) {
    console.error("Errore nella rimozione dell'assegnazione:", error);
    throw new Error("Impossibile rimuovere l'assegnazione del volontario.");
  }
};

/**
 * Rimuove TUTTE le assegnazioni di un dato volontario da un evento.
 */
export const rimuoviVolontarioDaEvento = async (eventId: string, userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, ASSEGNAZIONI_COLLECTION), 
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log(`Tutte le assegnazioni per l'utente ${userId} dall'evento ${eventId} rimosse.`);
  } catch (error) {
    console.error("Errore nella rimozione del volontario dall'evento:", error);
    throw new Error("Impossibile rimuovere il volontario dall'evento.");
  }
};