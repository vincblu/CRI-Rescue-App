// src/services/eventService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Interfaccia per i dati dell'evento (senza ID, per la creazione)
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
}

// Interfaccia per l'evento completo (con ID, dal database)
export interface Event extends EventData {
  id: string;
  createdAt: any;
  updatedAt: any;
}

// Collezione eventi
const EVENTS_COLLECTION = 'events';

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
      events.push({
        id: doc.id,
        ...doc.data()
      } as Event);
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
 * Recupera un singolo evento per ID
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventSnap = await getDocs(query(collection(db, EVENTS_COLLECTION)));
    
    let event: Event | null = null;
    eventSnap.forEach((doc) => {
      if (doc.id === eventId) {
        event = {
          id: doc.id,
          ...doc.data()
        } as Event;
      }
    });
    
    return event;
  } catch (error) {
    console.error('Errore nel recupero evento:', error);
    throw new Error('Impossibile recuperare l\'evento');
  }
};