// src/services/eventService.ts - CON CASCADING DELETE CORRETTO
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  where,
  writeBatch
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
  eventoAttivo?: boolean;
  squadreConfigurate?: { id: string; nome: string; maxVolontari: number; }[];
}

// Interfaccia per documenti squadra dal database
export interface SquadraDocument {
  id: string;
  nome: string;
  eventoId: string;
  membri: string[];
  attiva?: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface Event extends EventData {
  id: string;
  createdAt: any; 
  updatedAt: any; 
}

export interface EventoAssegnazione {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  squadraId: string;
  ruolo?: 'volontario' | 'coordinatore';
  timestampAssegnazione: any; 
}

export type SquadreRaggruppate = Record<string, EventoAssegnazione[]>;

export interface Volontario {
  uid: string;
  nome: string;
  cognome: string;
  email: string;
  role?: string; 
}

// --- NOMI COLLEZIONI ---
const EVENTS_COLLECTION = 'events';
const SQUADRE_COLLECTION = 'squadre';
const USERS_COLLECTION = 'users';
const ASSEGNAZIONI_COLLECTION = 'assegnazioni';

// --- FUNZIONI EVENTI BASE ---

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
 * 🔥 ELIMINA EVENTO CON CASCADING DELETE COMPLETO
 * Rimuove evento, squadre e tutte le assegnazioni correlate
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    console.log('🗑️ Iniziando eliminazione cascading per evento:', eventId);

    // STEP 1: Trova tutte le squadre associate all'evento
    const squadreQuery = query(
      collection(db, SQUADRE_COLLECTION), 
      where('eventoId', '==', eventId)
    );
    const squadreSnapshot = await getDocs(squadreQuery);
    console.log(`📋 Trovate ${squadreSnapshot.size} squadre da eliminare`);

    // STEP 2: Raccogli tutti i volontari assegnati
    const volontariDaLiberare = new Set<string>();
    squadreSnapshot.forEach((squadraDoc) => {
      const squadraData = squadraDoc.data() as SquadraDocument;
      if (squadraData.membri && Array.isArray(squadraData.membri)) {
        squadraData.membri.forEach((membroId: string) => {
          volontariDaLiberare.add(membroId);
        });
      }
    });

    console.log(`👥 Trovati ${volontariDaLiberare.size} volontari da liberare`);

    // STEP 3: Usa batch per operazioni atomiche
    const batch = writeBatch(db);

    // 3a. Elimina tutte le squadre dell'evento
    squadreSnapshot.forEach((squadraDoc) => {
      batch.delete(squadraDoc.ref);
    });

    // 3b. Rimuovi assegnazioni dai profili volontari
    for (const volontarioId of volontariDaLiberare) {
      const userRef = doc(db, USERS_COLLECTION, volontarioId);
      batch.update(userRef, {
        squadraAssegnata: null,
        eventoAttivo: null,
        updatedAt: serverTimestamp()
      });
    }

    // 3c. Elimina l'evento stesso
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    batch.delete(eventRef);

    // STEP 4: Commit di tutte le operazioni
    await batch.commit();

    console.log('✅ Eliminazione cascading completata:', {
      eventoEliminato: eventId,
      squadreEliminate: squadreSnapshot.size,
      volontariLiberati: volontariDaLiberare.size
    });

  } catch (error) {
    console.error('❌ Errore nell\'eliminazione cascading evento:', error);
    throw new Error('Impossibile eliminare l\'evento e le sue dipendenze');
  }
};

/**
 * 🧹 FUNZIONE DI PULIZIA - Rimuove solo assegnazioni senza eliminare squadre
 */
export const cleanEventAssignments = async (eventId: string): Promise<void> => {
  try {
    console.log('🧹 Pulendo assegnazioni per evento:', eventId);

    // Trova squadre dell'evento
    const squadreQuery = query(
      collection(db, SQUADRE_COLLECTION), 
      where('eventoId', '==', eventId)
    );
    const squadreSnapshot = await getDocs(squadreQuery);

    // Raccogli volontari da liberare
    const volontariDaLiberare = new Set<string>();
    squadreSnapshot.forEach((squadraDoc) => {
      const squadraData = squadraDoc.data() as SquadraDocument;
      if (squadraData.membri && Array.isArray(squadraData.membri)) {
        squadraData.membri.forEach((membroId: string) => {
          volontariDaLiberare.add(membroId);
        });
      }
    });

    // Batch per liberare volontari e svuotare squadre
    const batch = writeBatch(db);

    // Libera volontari
    for (const volontarioId of volontariDaLiberare) {
      const userRef = doc(db, USERS_COLLECTION, volontarioId);
      batch.update(userRef, {
        squadraAssegnata: null,
        eventoAttivo: null,
        updatedAt: serverTimestamp()
      });
    }

    // Svuota squadre ma non eliminarle
    squadreSnapshot.forEach((squadraDoc) => {
      batch.update(squadraDoc.ref, {
        membri: [],
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    console.log(`✅ Liberati ${volontariDaLiberare.size} volontari dall'evento ${eventId}`);

  } catch (error) {
    console.error('❌ Errore pulizia assegnazioni:', error);
    throw new Error('Impossibile pulire le assegnazioni dell\'evento');
  }
};

/**
 * Recupera un singolo evento per ID
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(eventRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null; 
  } catch (error) {
    console.error('Errore nel recupero evento per ID:', error);
    throw new Error('Impossibile recuperare l\'evento per ID');
  }
};

/**
 * 🔍 DIAGNOSTICA - Verifica stato assegnazioni per un evento
 */
export const diagnoseEventAssignments = async (eventId: string): Promise<{
  evento: Event | null;
  squadre: SquadraDocument[];
  volontariAssegnati: string[];
  problemi: string[];
}> => {
  try {
    console.log('🔍 Diagnosticando assegnazioni per evento:', eventId);

    const problemi: string[] = [];

    // Recupera evento
    const evento = await getEventById(eventId);
    if (!evento) {
      problemi.push('Evento non trovato');
    }

    // Recupera squadre
    const squadreQuery = query(
      collection(db, SQUADRE_COLLECTION), 
      where('eventoId', '==', eventId)
    );
    const squadreSnapshot = await getDocs(squadreQuery);
    const squadre = squadreSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SquadraDocument));

    // Raccogli volontari assegnati
    const volontariAssegnati = new Set<string>();
    squadre.forEach(squadra => {
      if (squadra.membri && Array.isArray(squadra.membri)) {
        squadra.membri.forEach((membroId: string) => {
          volontariAssegnati.add(membroId);
        });
      }
    });

    // Verifica coerenza volontari
    for (const volontarioId of volontariAssegnati) {
      try {
        const userRef = doc(db, USERS_COLLECTION, volontarioId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.eventoAttivo !== eventId) {
            problemi.push(`Volontario ${volontarioId} assegnato a squadra ma eventoAttivo è ${userData.eventoAttivo}`);
          }
        } else {
          problemi.push(`Volontario ${volontarioId} non esiste ma è assegnato a squadra`);
        }
      } catch (error) {
        problemi.push(`Errore verifica volontario ${volontarioId}: ${error}`);
      }
    }

    return {
      evento,
      squadre,
      volontariAssegnati: Array.from(volontariAssegnati),
      problemi
    };

  } catch (error) {
    console.error('❌ Errore diagnostica:', error);
    return {
      evento: null,
      squadre: [] as SquadraDocument[],
      volontariAssegnati: [],
      problemi: [`Errore diagnostica: ${error}`]
    };
  }
};

// --- FUNZIONI ASSEGNAZIONI (mantenute per compatibilità) ---

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

export const rimuoviVolontarioDaAssegnazione = async (assegnazioneId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ASSEGNAZIONI_COLLECTION, assegnazioneId));
    console.log(`Assegnazione ${assegnazioneId} rimossa.`);
  } catch (error) {
    console.error("Errore nella rimozione dell'assegnazione:", error);
    throw new Error("Impossibile rimuovere l'assegnazione del volontario.");
  }
};

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