// src/types/navigation.ts
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Interfaces per Event (local per evitare circular imports)
interface EventBasic {
  id: string;
  nomeEvento: string;
  localita: string;
  dataEvento?: string;
  oraInizio?: string;
  oraFine?: string;
  livello?: 'Low' | 'Medium' | 'High';
  note?: string;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: any; // Rimosso '?' per renderlo richiesto
  updatedAt: any; // Rimosso '?' per renderlo richiesto
}

// Stack principale App con Login
export type AppStackParamList = {
  Login: undefined;
  HomeMain: undefined;
  EventDetail: { 
    eventId: string; 
    event?: EventBasic; // Potrebbe essere EventBasic o Event (ma se arriva da DB sarà Event)
  };
  TeamConfiguration: { 
    eventId: string; 
  };
  VolunteerSelection: { 
    eventId: string; 
    teamId?: string; 
  };
};

// Alias per compatibilità (molti file usano RootStackParamList)
export type RootStackParamList = AppStackParamList;

// Navigation Props per schermate
export type HomeNavigationProp = NavigationProp<RootStackParamList>;
export type LoginNavigationProp = NavigationProp<RootStackParamList>;

// Screen Props per componenti
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type EventDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;
export type TeamConfigurationScreenProps = NativeStackScreenProps<RootStackParamList, 'TeamConfiguration'>;
export type VolunteerSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'VolunteerSelection'>;

// Route Props per parametri
export type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
export type TeamConfigurationRouteProp = RouteProp<RootStackParamList, 'TeamConfiguration'>;
export type VolunteerSelectionRouteProp = RouteProp<RootStackParamList, 'VolunteerSelection'>;

// Helper type per navigation generica
export type AppNavigation = NavigationProp<RootStackParamList>;