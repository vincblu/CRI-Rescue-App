// src/services/squadraService.ts - VERSIONE SEMPLIFICATA
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { 
  Squadra, 
  CreateSquadraData, 
  UpdateSquadraData, 
  SquadraConMembri,
  MembroSquadra,
  SquadraFilters,
  SquadraOperationResult 
} from '../types/squadra';
import { getUserProfile } from './userService';

const SQUADRE_COLLECTION = 'squadre';
const USERS_COLLECTION = 'users';

/**
 * Crea una nuova squadra SAP
 */
export const createSquadra = async (squadraData: CreateSquadraData): Promise<SquadraOperationResult> => {
  try {
    console.log('🆕 Creando nuova squadra:', squadraData);

    // Verifica che il nome squadra non esista già per questo evento
    const existingSquadra = await getSquadraByNomeEvento(squadraData.nome, squadraData.eventoId);
    if (existingSquadra) {
      return {
        success: false,
        message: `La squadra ${squadraData.nome} esiste già per questo evento`,
        error: 'SQUADRA_EXISTS'
      };
    }

    // Crea il documento squadra
    const docRef = await addDoc(collection(db, SQUADRE_COLLECTION), {
      ...squadraData,
      attiva: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Squadra creata con ID:', docRef.id);

    // Aggiorna i profili utenti con la nuova assegnazione
    if (squadraData.membri.length > 0) {
      await assegnaVolontariASquadra(docRef.id, squadraData.membri, squadraData.eventoId);
    }

    return {
      success: true,
      message: `Squadra ${squadraData.nome} creata con successo`,
      data: { squadraId: docRef.id }
    };

  } catch (error) {
    console.error('❌ Errore creazione squadra:', error);
    return {
      success: false,
      message: 'Errore nella creazione della squadra',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
};

/**
 * 🔧 QUERY SEMPLIFICATA - Recupera tutte le squadre per evento
 */
export const getSquadre = async (filters: SquadraFilters = {}): Promise<Squadra[]> => {
  try {
    console.log('🔍 Query squadre con filtri:', filters);

    // Query semplice - solo un filtro alla volta per evitare index
    let q;
    
    if (filters.eventoId) {
      // Prima priorità: filtra per evento
      q = query(collection(db, SQUADRE_COLLECTION), where('eventoId', '==', filters.eventoId));
    } else {
      // Query base senza filtri complessi
      q = collection(db, SQUADRE_COLLECTION);
    }

    const querySnapshot = await getDocs(q);
    const squadre: Squadra[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filtri aggiuntivi in JavaScript per evitare indici complessi
      if (filters.attiva !== undefined && data.attiva !== filters.attiva) {
        return; // Skip se non matcha il filtro attiva
      }
      
      if (filters.createdBy && data.createdBy !== filters.createdBy) {
        return; // Skip se non matcha il filtro createdBy
      }

      squadre.push({
        id: doc.id,
        ...data
      } as Squadra);
    });

    // Ordina in JavaScript per evitare index complessi
    squadre.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // Ordine decrescente
    });

    console.log(`📋 Recuperate ${squadre.length} squadre`);
    return squadre;

  } catch (error) {
    console.error('❌ Errore recupero squadre:', error);
    throw new Error('Impossibile recuperare le squadre');
  }
};

/**
 * Recupera squadre con dettagli completi dei membri
 */
export const getSquadreConMembri = async (eventoId: string): Promise<SquadraConMembri[]> => {
  try {
    console.log('🔍 Recuperando squadre con membri per evento:', eventoId);
    
    const squadre = await getSquadre({ eventoId, attiva: true });
    const squadreConMembri: SquadraConMembri[] = [];

    for (const squadra of squadre) {
      const membriDettaglio: MembroSquadra[] = [];

      // Recupera dettagli per ogni membro
      for (const membroId of squadra.membri) {
        try {
          const userProfile = await getUserProfile(membroId);
          if (userProfile) {
            membriDettaglio.push({
              uid: userProfile.uid,
              nome: userProfile.nome || 'Nome non disponibile',
              displayName: userProfile.displayName || userProfile.nome || 'N/A',
              email: userProfile.email || 'Email non disponibile',
              qualifica: userProfile.qualifica,
              telefono: userProfile.telefono,
              role: userProfile.role || 'user'
            });
          }
        } catch (memberError) {
          console.warn(`⚠️ Errore recupero membro ${membroId}:`, memberError);
        }
      }

      squadreConMembri.push({
        ...squadra,
        membriDettaglio
      });
    }

    console.log(`✅ Recuperate ${squadreConMembri.length} squadre con membri`);
    return squadreConMembri;

  } catch (error) {
    console.error('❌ Errore recupero squadre con membri:', error);
    throw new Error('Impossibile recuperare i dettagli delle squadre');
  }
};

/**
 * Recupera una singola squadra per ID
 */
export const getSquadraById = async (squadraId: string): Promise<Squadra | null> => {
  try {
    const squadraRef = doc(db, SQUADRE_COLLECTION, squadraId);
    const squadraSnap = await getDoc(squadraRef);

    if (squadraSnap.exists()) {
      return {
        id: squadraSnap.id,
        ...squadraSnap.data()
      } as Squadra;
    }

    return null;
  } catch (error) {
    console.error('❌ Errore recupero squadra:', error);
    throw new Error('Impossibile recuperare la squadra');
  }
};

/**
 * 🔧 QUERY SEMPLIFICATA - Recupera squadra per nome ed evento
 */
export const getSquadraByNomeEvento = async (nome: string, eventoId: string): Promise<Squadra | null> => {
  try {
    // Query semplice - un solo where
    const q = query(
      collection(db, SQUADRE_COLLECTION),
      where('eventoId', '==', eventoId)
    );

    const querySnapshot = await getDocs(q);
    
    // Filtra per nome in JavaScript
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.nome === nome) {
        return {
          id: doc.id,
          ...data
        } as Squadra;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Errore verifica squadra esistente:', error);
    return null;
  }
};

/**
 * Aggiorna una squadra esistente
 */
export const updateSquadra = async (
  squadraId: string, 
  updateData: UpdateSquadraData
): Promise<SquadraOperationResult> => {
  try {
    console.log('🔄 Aggiornando squadra:', squadraId, updateData);

    const squadraRef = doc(db, SQUADRE_COLLECTION, squadraId);
    
    // Prepara i dati per l'aggiornamento
    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(squadraRef, dataToUpdate);

    console.log('✅ Squadra aggiornata con successo:', squadraId);

    return {
      success: true,
      message: 'Squadra aggiornata con successo'
    };

  } catch (error) {
    console.error('❌ Errore aggiornamento squadra:', error);
    return {
      success: false,
      message: 'Errore nell\'aggiornamento della squadra',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
};

/**
 * Assegna volontari a una squadra (aggiorna anche i profili utente)
 */
export const assegnaVolontariASquadra = async (
  squadraId: string, 
  volontariIds: string[], 
  eventoId: string
): Promise<SquadraOperationResult> => {
  try {
    console.log('👥 Assegnando volontari a squadra:', { squadraId, volontariIds, eventoId });

    const batch = writeBatch(db);

    // Aggiorna la squadra con i nuovi membri
    const squadraRef = doc(db, SQUADRE_COLLECTION, squadraId);
    batch.update(squadraRef, {
      membri: volontariIds,
      updatedAt: serverTimestamp()
    });

    // Aggiorna ogni profilo utente
    for (const volontarioId of volontariIds) {
      const userRef = doc(db, USERS_COLLECTION, volontarioId);
      batch.update(userRef, {
        squadraAssegnata: squadraId,
        eventoAttivo: eventoId
      });
    }

    await batch.commit();

    console.log('✅ Volontari assegnati con successo');

    return {
      success: true,
      message: `${volontariIds.length} volontari assegnati con successo`
    };

  } catch (error) {
    console.error('❌ Errore assegnazione volontari:', error);
    return {
      success: false,
      message: 'Errore nell\'assegnazione dei volontari',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
};

/**
 * Rimuove volontari da tutte le squadre (per riassegnazione)
 */
export const rimuoviVolontariDaSquadre = async (volontariIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Rimuovi assegnazioni dai profili utente
    for (const volontarioId of volontariIds) {
      const userRef = doc(db, USERS_COLLECTION, volontarioId);
      batch.update(userRef, {
        squadraAssegnata: null,
        eventoAttivo: null
      });
    }

    await batch.commit();
    console.log('✅ Volontari rimossi dalle squadre');

  } catch (error) {
    console.error('❌ Errore rimozione volontari:', error);
    throw new Error('Errore nella rimozione dei volontari');
  }
};

/**
 * Elimina una squadra (e rimuove assegnazioni)
 */
export const deleteSquadra = async (squadraId: string): Promise<SquadraOperationResult> => {
  try {
    console.log('🗑️ Eliminando squadra:', squadraId);

    // Prima recupera la squadra per ottenere i membri
    const squadra = await getSquadraById(squadraId);
    if (!squadra) {
      return {
        success: false,
        message: 'Squadra non trovata',
        error: 'SQUADRA_NOT_FOUND'
      };
    }

    // Rimuovi assegnazioni dai volontari
    if (squadra.membri.length > 0) {
      await rimuoviVolontariDaSquadre(squadra.membri);
    }

    // Elimina il documento squadra
    await deleteDoc(doc(db, SQUADRE_COLLECTION, squadraId));

    console.log('✅ Squadra eliminata con successo');

    return {
      success: true,
      message: 'Squadra eliminata con successo'
    };

  } catch (error) {
    console.error('❌ Errore eliminazione squadra:', error);
    return {
      success: false,
      message: 'Errore nell\'eliminazione della squadra',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
};

/**
 * 🔧 VERSIONE SEMPLIFICATA - Genera il prossimo nome squadra
 */
export const getNextSquadraNome = async (eventoId: string): Promise<string> => {
  try {
    console.log('🔢 Generando prossimo nome squadra per evento:', eventoId);
    
    const squadre = await getSquadre({ eventoId, attiva: true });
    
    // Estrae i numeri dalle squadre esistenti (SAP-001, SAP-002, etc.)
    const numeriUsati = new Set<number>();
    
    squadre.forEach(s => {
      const match = s.nome.match(/SAP-(\d+)/);
      if (match) {
        numeriUsati.add(parseInt(match[1], 10));
      }
    });

    // Trova il prossimo numero disponibile
    let nextNumber = 1;
    while (numeriUsati.has(nextNumber)) {
      nextNumber++;
    }

    const nomeSquadra = `SAP-${nextNumber.toString().padStart(3, '0')}`;
    console.log('✅ Prossimo nome squadra:', nomeSquadra);
    
    return nomeSquadra;

  } catch (error) {
    console.error('❌ Errore generazione nome squadra:', error);
    return 'SAP-001'; // Fallback
  }
};

/**
 * Verifica se un utente è assegnato a una squadra
 */
export const isUtenteInSquadra = async (userId: string, squadraId?: string): Promise<boolean> => {
  try {
    if (!squadraId) return false;

    const squadra = await getSquadraById(squadraId);
    return squadra ? squadra.membri.includes(userId) : false;

  } catch (error) {
    console.error('❌ Errore verifica utente in squadra:', error);
    return false;
  }
};