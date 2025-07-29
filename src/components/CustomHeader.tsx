// src/components/CustomHeader.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../config/firebaseConfig';
import { getUserProfile } from '../services/userService';
import { getSquadraById } from '../services/squadraService';
import { getEventById } from '../services/eventService';

interface CustomHeaderProps {
  onLogout: () => void;
}

interface EventoInfo {
  nomeEvento: string;
  oraInizio?: string;
  oraFine?: string;
  dataEvento?: string;
}

interface UserSquadraInfo {
  nomeSquadra: string;
  membriNomi: string[];
}

interface UserEventInfo {
  eventoInfo?: EventoInfo;
  squadraInfo?: UserSquadraInfo;
  isAdmin: boolean;
}

export default function CustomHeader({ onLogout }: CustomHeaderProps) {
  const [userEventInfo, setUserEventInfo] = useState<UserEventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserEventInfo();
  }, []);

  const loadUserEventInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      console.log('📊 Caricando info evento e squadra per header:', currentUser.uid);

      // Recupera il profilo utente
      const userProfile = await getUserProfile(currentUser.uid);
      if (!userProfile) {
        setLoading(false);
        return;
      }

      const isAdmin = userProfile.role === 'admin';
      let eventoInfo: EventoInfo | undefined;
      let squadraInfo: UserSquadraInfo | undefined;

      // Se l'utente ha un evento attivo, carica i dettagli
      if (userProfile.eventoAttivo) {
        console.log('📅 Caricando dettagli evento:', userProfile.eventoAttivo);
        
        try {
          const evento = await getEventById(userProfile.eventoAttivo);
          if (evento) {
            eventoInfo = {
              nomeEvento: evento.nomeEvento,
              oraInizio: evento.oraInizio,
              oraFine: evento.oraFine,
              dataEvento: evento.dataEvento
            };
            console.log('✅ Info evento caricata:', eventoInfo);
          }
        } catch (error) {
          console.warn('⚠️ Errore caricamento evento:', error);
        }
      }

      // Se l'utente ha una squadra assegnata, carica i dettagli
      if (userProfile.squadraAssegnata && userProfile.eventoAttivo) {
        console.log('🏢 Caricando dettagli squadra:', userProfile.squadraAssegnata);
        
        try {
          const squadra = await getSquadraById(userProfile.squadraAssegnata);
          if (squadra) {
            // Recupera i nomi di tutti i membri della squadra
            const membriNomi: string[] = [];
            
            for (const membroId of squadra.membri) {
              try {
                const membroProfile = await getUserProfile(membroId);
                if (membroProfile) {
                  const nomeMembro = membroProfile.displayName || 
                                   membroProfile.nome || 
                                   'Volontario';
                  membriNomi.push(nomeMembro);
                }
              } catch (error) {
                console.warn('⚠️ Errore caricamento membro:', membroId);
              }
            }

            squadraInfo = {
              nomeSquadra: squadra.nome,
              membriNomi
            };

            console.log('✅ Info squadra caricata:', squadraInfo);
          }
        } catch (error) {
          console.warn('⚠️ Errore caricamento squadra:', error);
        }
      }

      setUserEventInfo({
        eventoInfo,
        squadraInfo,
        isAdmin
      });

    } catch (error) {
      console.error('❌ Errore caricamento info evento/squadra:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventInfo = () => {
    if (loading) {
      return (
        <View style={styles.infoContainer}>
          <Text style={styles.loadingText}>Caricamento informazioni...</Text>
        </View>
      );
    }

    if (!userEventInfo) {
      return null;
    }

    // Per ADMIN: mostra solo ruolo (senza info evento/squadra)
    if (userEventInfo.isAdmin) {
      return (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="shield-account" size={16} color="#E30000" />
            <Text style={styles.adminText}>Modalità Responsabile</Text>
          </View>
        </View>
      );
    }

    // Per USER: mostra info complete evento e squadra
    return (
      <View style={styles.infoContainer}>
        {/* Riga 1: Evento */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#E30000" />
          <Text style={styles.infoLabel}>Evento:</Text>
          <Text style={styles.infoValue}>
            {userEventInfo.eventoInfo 
              ? userEventInfo.eventoInfo.nomeEvento 
              : 'Nessun evento assegnato'
            }
          </Text>
        </View>

        {/* Riga 2: Orari (solo se evento presente) */}
        {userEventInfo.eventoInfo && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock" size={16} color="#E30000" />
            <Text style={styles.infoLabel}>Orario:</Text>
            <Text style={styles.infoValue}>
              {userEventInfo.eventoInfo.oraInizio || 'N/A'} - {userEventInfo.eventoInfo.oraFine || 'N/A'}
            </Text>
          </View>
        )}

        {/* Riga 3: Squadra */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-group" size={16} color="#E30000" />
          <Text style={styles.infoLabel}>Squadra:</Text>
          {userEventInfo.squadraInfo ? (
            <Text style={styles.infoValue}>
              {userEventInfo.squadraInfo.nomeSquadra}
              {userEventInfo.squadraInfo.membriNomi.length > 0 && 
                ` (${userEventInfo.squadraInfo.membriNomi.join(', ')})`
              }
            </Text>
          ) : (
            <Text style={styles.noAssignmentText}>Nessuna squadra assegnata</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header principale con logo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/logo_cri.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.textSection}>
              <Text style={styles.titleText}>CRI RESCUE</Text>
              <Text style={styles.subtitleText}>Comitato Napoli Nord</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={onLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={24} 
              color="#E30000" 
            />
          </TouchableOpacity>
        </View>

        {/* Sezione informazioni evento/squadra */}
        {renderEventInfo()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 5 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 60,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  textSection: {
    flexDirection: 'column',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E30000',
    lineHeight: 18,
  },
  subtitleText: {
    fontSize: 12,
    color: '#E30000',
    lineHeight: 14,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(227, 0, 0, 0.1)',
    marginLeft: 10,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 🆕 STILI PER SEZIONE INFORMAZIONI EVENTO/SQUADRA
  infoContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 50,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    lineHeight: 16,
  },
  noAssignmentText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E30000',
  },
});