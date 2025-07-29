// src/types/squadra.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Interfaccia per una squadra SAP nel database
 */
export interface Squadra {
  id: string;
  nome: string; // "SAP-001", "SAP-002", etc.
  eventoId: string;
  membri: string[]; // Array di userId dei volontari assegnati
  createdBy: string; // UID dell'admin che ha creato la squadra
  createdAt: Timestamp;
  updatedAt: Timestamp;
  attiva: boolean; // Per disabilitare squadre senza eliminarle
}

/**
 * Dati per creare una nuova squadra
 */
export interface CreateSquadraData {
  nome: string;
  eventoId: string;
  membri: string[];
  createdBy: string;
}

/**
 * Dati per aggiornare una squadra esistente
 */
export interface UpdateSquadraData {
  nome?: string;
  membri?: string[];
  attiva?: boolean;
  lastModifiedBy: string;
}

/**
 * Squadra con informazioni dettagliate sui membri
 */
export interface SquadraConMembri extends Squadra {
  membriDettaglio: MembroSquadra[];
}

/**
 * Informazioni dettagliate di un membro della squadra
 */
export interface MembroSquadra {
  uid: string;
  nome: string;
  displayName: string;
  email: string;
  qualifica?: string;
  telefono?: string;
  role: 'user' | 'admin';
}

/**
 * Statistiche squadra per dashboard
 */
export interface SquadraStats {
  squadraId: string;
  nomeSquadra: string;
  numeroMembri: number;
  membriAttivi: number;
  ultimaAttivita?: Timestamp;
  stato: 'libera' | 'intervento' | 'trasferimento';
}

/**
 * Filtri per query squadre
 */
export interface SquadraFilters {
  eventoId?: string;
  attiva?: boolean;
  conMembri?: boolean;
  createdBy?: string;
}

/**
 * Risultato operazioni squadra
 */
export interface SquadraOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}