// src/types/navigation.ts
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Stack per utenti NON autenticati
export type AuthStackParamList = {
  Login: undefined;
};

// Stack per utenti autenticati (principale)
export type RootStackParamList = {
  HomeMain: { 
    initialMode?: string; // ← Completamente opzionale
  } | undefined; // ← Può essere chiamata senza parametri
  EventDetail: { 
    eventId: string; 
    event?: any;
    initialMode?: string;
  };
  TeamConfiguration: { 
    eventId: string; 
  };
  VolunteerSelection: { 
    eventId: string;
    squadraId?: string;
    teamId?: string; // ← Alias per compatibilità
    nomeSquadra?: string;
    isNewSquadra?: boolean;
    membriEsistenti?: string[];
  };
};

// Stack completo (per App.tsx)
export type AppStackParamList = AuthStackParamList & RootStackParamList;

// === PROPS SCREENS AUTH ===
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// === PROPS SCREENS MAIN ===
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'HomeMain'>;
export type EventDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;
export type TeamConfigurationScreenProps = NativeStackScreenProps<RootStackParamList, 'TeamConfiguration'>;
export type VolunteerSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'VolunteerSelection'>;

// === ROUTE PROPS ===
export type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
export type TeamConfigurationRouteProp = RouteProp<RootStackParamList, 'TeamConfiguration'>;
export type VolunteerSelectionRouteProp = RouteProp<RootStackParamList, 'VolunteerSelection'>;

// === NAVIGATION PROPS ===
export type HomeNavigationProp = NavigationProp<RootStackParamList>;
export type AppNavigation = NavigationProp<AppStackParamList>;
export type AuthNavigation = NavigationProp<AuthStackParamList>;

// === LEGACY COMPATIBILITY ===
// Per compatibilità con file esistenti che potrebbero usare questi nomi
export type RootNavigation = NavigationProp<RootStackParamList>;

/**
 * Props estese per navigazione con informazioni squadra
 */
export interface SquadraNavigationProps {
  eventId: string;
  squadraId?: string;
  nomeSquadra?: string;
  isEdit?: boolean;
}

/**
 * Parametri per creazione nuova squadra
 */
export interface CreateSquadraParams {
  eventId: string;
  nomeSquadra: string;
  userId: string; // Admin che crea la squadra
}

/**
 * Parametri per modifica squadra esistente
 */
export interface EditSquadraParams {
  eventId: string;
  squadraId: string;
  nomeSquadra: string;
  membriAttuali: string[];
}