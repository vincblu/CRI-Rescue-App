// src/screens/EventDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

// Services & Context
import { 
  updateEvent, 
  deleteEvent, // NUOVO: Import deleteEvent
  Event, 
  setEventoAttivo, 
  getAssegnazioniEvento, 
  getSquadreConAssegnazioni,
  configuraSquadreStandard,
  EventoAssegnazione
} from '../services/eventService';
import { useAuth, usePermissions, AdminOnly } from '../context/AuthContext';

// Types
import { AppStackParamList, AppNavigation } from '../types/navigation';

type EventDetailRouteProp = RouteProp<AppStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC = () => {
  const route = useRoute<EventDetailRouteProp>();
  const navigation = useNavigation<AppNavigation>();
  const { currentUser } = useAuth();
  const { 
    isAdmin, 
    canModifyEvents, 
    nome, 
    cognome 
  } = usePermissions();

  // Dati evento da parametri
  const { eventId, event: initialEvent } = route.params;

  // Stati componente
  const [event, setEvent] = useState<Event | null>(initialEvent || null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // NUOVO: Stato per cancellazione

  // NUOVO: Stati per gestione volontari
  const [assegnazioni, setAssegnazioni] = useState<EventoAssegnazione[]>([]);
  const [squadreRaggruppate, setSquadreRaggruppate] = useState<Record<string, EventoAssegnazione[]>>({});
  const [loadingAssegnazioni, setLoadingAssegnazioni] = useState(false);

  // Stati form modifica
  const [nomeEvento, setNomeEvento] = useState('');
  const [localita, setLocalita] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [oraInizio, setOraInizio] = useState('');
  const [oraFine, setOraFine] = useState('');
  const [livello, setLivello] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [note, setNote] = useState('');

  // Inizializzazione dati
  useEffect(() => {
    if (event) {
      console.log('📋 Caricamento dettagli evento:', event.id);
      setNomeEvento(event.nomeEvento || '');
      setLocalita(event.localita || '');
      setDataEvento(event.dataEvento || '');
      setOraInizio(event.oraInizio || '');
      setOraFine(event.oraFine || '');
      setLivello(event.livello || 'Low');
      setNote(event.note || '');

      // NUOVO: Carica assegnazioni se admin
      if (isAdmin) {
        loadAssegnazioni();
      }
    }
  }, [event, isAdmin]);

  // NUOVO: Carica assegnazioni volontari
  const loadAssegnazioni = async () => {
    try {
      setLoadingAssegnazioni(true);
      
      const [assegnazioniData, squadreData] = await Promise.all([
        getAssegnazioniEvento(eventId),
        getSquadreConAssegnazioni(eventId)
      ]);

      setAssegnazioni(assegnazioniData);
      setSquadreRaggruppate(squadreData);
      
      console.log('👥 Assegnazioni caricate:', assegnazioniData.length);
      console.log('🏢 Squadre raggruppate:', Object.keys(squadreData).length);

    } catch (error) {
      console.error('❌ Errore caricamento assegnazioni:', error);
    } finally {
      setLoadingAssegnazioni(false);
    }
  };

  // Avvia modifica (solo admin)
  const startEditing = () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Non hai i permessi per modificare questo evento');
      return;
    }
    setIsEditing(true);
  };

  // Annulla modifiche
  const cancelEditing = () => {
    if (!event) return;
    
    // Ripristina valori originali
    setNomeEvento(event.nomeEvento || '');
    setLocalita(event.localita || '');
    setDataEvento(event.dataEvento || '');
    setOraInizio(event.oraInizio || '');
    setOraFine(event.oraFine || '');
    setLivello(event.livello || 'Low');
    setNote(event.note || '');
    
    setIsEditing(false);
  };

  // Salva modifiche
  const saveChanges = async () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Non hai i permessi per salvare modifiche');
      return;
    }

    if (!nomeEvento.trim() || !localita.trim()) {
      Alert.alert('Errore', 'Nome evento e località sono obbligatori');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Salvataggio modifiche evento:', eventId);

      const updateData = {
        nomeEvento: nomeEvento.trim(),
        localita: localita.trim(),
        dataEvento: dataEvento.trim(),
        oraInizio: oraInizio.trim(),
        oraFine: oraFine.trim(),
        livello,
        note: note.trim(),
        lastModifiedBy: currentUser?.email || 'Unknown'
      };

      await updateEvent(eventId, updateData);

      // Aggiorna stato locale
      const updatedEvent = {
        ...event!,
        ...updateData
      };
      setEvent(updatedEvent);
      setIsEditing(false);

      console.log('✅ Evento salvato con successo');
      Alert.alert('Successo', 'Modifiche salvate con successo!');

    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
    } finally {
      setSaving(false);
    }
  };

  // NUOVO: Funzione per cancellare evento
  const handleDeleteEvent = () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Non hai i permessi per cancellare questo evento');
      return;
    }

    // Verifica se ci sono volontari assegnati
    if (assegnazioni.length > 0) {
      Alert.alert(
        '⚠️ Attenzione',
        `Ci sono ${assegnazioni.length} volontari assegnati a questo evento.\n\nPer continuare con la cancellazione, dovrai prima rimuovere tutte le assegnazioni.`,
        [
          { text: 'Annulla', style: 'cancel' },
          { 
            text: 'Cancella Comunque', 
            style: 'destructive',
            onPress: () => confirmDeleteEvent() 
          }
        ]
      );
      return;
    }

    confirmDeleteEvent();
  };

  // NUOVO: Conferma cancellazione evento
  const confirmDeleteEvent = () => {
    Alert.alert(
      '🗑️ CANCELLA EVENTO',
      `Sei SICURO di voler cancellare definitivamente l'evento:\n\n"${event?.nomeEvento}"\n\n⚠️ QUESTA AZIONE NON PUÒ ESSERE ANNULLATA!\n\n• Tutte le configurazioni verranno perse\n• Le assegnazioni volontari verranno rimosse\n• La cronologia dell'evento verrà eliminata`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: '🗑️ CANCELLA DEFINITIVAMENTE',
          style: 'destructive',
          onPress: executeDeleteEvent,
        },
      ],
      { cancelable: true }
    );
  };

  // NUOVO: Esegui cancellazione evento
  const executeDeleteEvent = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ Cancellazione evento:', eventId);

      await deleteEvent(eventId);

      console.log('✅ Evento cancellato con successo');
      
      // Torna alla home con messaggio di successo
      Alert.alert(
        '✅ Evento Cancellato',
        `L'evento "${event?.nomeEvento}" è stato cancellato definitivamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Torna alla home e forza refresh
              navigation.navigate('HomeMain');
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Errore cancellazione evento:', error);
      Alert.alert(
        'Errore Cancellazione',
        'Impossibile cancellare l\'evento. Riprova più tardi.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setDeleting(false);
    }
  };

  // NUOVO: Attiva/Disattiva evento
  const toggleEventoAttivo = async () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Non hai i permessi per gestire eventi');
      return;
    }

    const azione = event?.eventoAttivo ? 'disattivare' : 'attivare';
    
    Alert.alert(
      `Conferma ${azione.charAt(0).toUpperCase() + azione.slice(1)}`,
      `Sei sicuro di voler ${azione} questo evento?${!event?.eventoAttivo ? '\n\nQuesto sarà l\'unico evento attivo.' : ''}`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Conferma', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!event?.eventoAttivo) {
                await setEventoAttivo(eventId);
                setEvent(prev => prev ? { ...prev, eventoAttivo: true } : null);
                Alert.alert('✅ Evento Attivato', 'L\'evento è ora attivo per tutti i volontari');
              } else {
                // Per disattivare, aggiorna solo questo evento
                await updateEvent(eventId, { eventoAttivo: false } as any);
                setEvent(prev => prev ? { ...prev, eventoAttivo: false } : null);
                Alert.alert('📴 Evento Disattivato', 'L\'evento non è più attivo');
              }
            } catch (error) {
              console.error('❌ Errore toggle evento:', error);
              Alert.alert('Errore', `Impossibile ${azione} l'evento`);
            }
          }
        }
      ]
    );
  };

  // NUOVO: Configura squadre standard
  const handleConfiguraSquadre = async () => {
    Alert.alert(
      'Configura Squadre',
      'Vuoi configurare le squadre standard SAP-001, SAP-002, SAP-003?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Configura', 
          onPress: async () => {
            try {
              await configuraSquadreStandard(eventId, 3);
              Alert.alert('✅ Squadre Configurate', 'Squadre SAP-001, SAP-002, SAP-003 create');
              await loadAssegnazioni();
            } catch (error) {
              console.error('❌ Errore configurazione squadre:', error);
              Alert.alert('Errore', 'Impossibile configurare squadre');
            }
          }
        }
      ]
    );
  };

  // Navigazione configurazione squadre (solo admin)
  const navigateToTeamConfig = () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Funzionalità riservata ai responsabili');
      return;
    }
    navigation.navigate('TeamConfiguration', { eventId });
  };

  // NUOVO: Navigazione selezione volontari
  const navigateToVolunteerSelection = (squadraId?: string) => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Funzionalità riservata ai responsabili');
      return;
    }
    navigation.navigate('VolunteerSelection', { eventId, teamId: squadraId });
  };

  // Colore livello
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return '#28A745';
      case 'Medium': return '#FFA500';
      case 'High': return '#E30000';
      default: return '#6C757D';
    }
  };

  // NUOVO: Render sezione gestione volontari
  const renderGestioneVolontari = () => {
    if (!isAdmin) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 Gestione Volontari</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={[styles.actionButton, event?.eventoAttivo ? styles.disableButton : styles.activateButton]}
              onPress={toggleEventoAttivo}
            >
              <MaterialCommunityIcons 
                name={event?.eventoAttivo ? "pause-circle" : "play-circle"} 
                size={16} 
                color="white" 
              />
              <Text style={styles.actionButtonText}>
                {event?.eventoAttivo ? 'Disattiva' : 'Attiva'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {event?.eventoAttivo && (
          <View style={styles.statusBanner}>
            <MaterialCommunityIcons name="circle" size={12} color="#28A745" />
            <Text style={styles.statusText}>Evento Attivo - Visibile ai volontari</Text>
          </View>
        )}

        {loadingAssegnazioni ? (
          <View style={styles.loadingAssegnazioni}>
            <ActivityIndicator size="small" color="#E30000" />
            <Text style={styles.loadingText}>Caricamento assegnazioni...</Text>
          </View>
        ) : (
          <>
            {assegnazioni.length === 0 ? (
              <View style={styles.noAssegnazioni}>
                <MaterialCommunityIcons name="account-off" size={48} color="#CCC" />
                <Text style={styles.noAssegnazioniText}>Nessun volontario assegnato</Text>
                <TouchableOpacity
                  style={styles.configuraButton}
                  onPress={navigateToTeamConfig} 
                >
                  <Text style={styles.configuraButtonText}>Configura Squadre</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.assegnazioniContainer}>
                <View style={styles.assegnazioniHeader}>
                  <Text style={styles.assegnazioniTitle}>
                    {assegnazioni.length} volontari assegnati in {Object.keys(squadreRaggruppate).length} squadre
                  </Text>
                  <TouchableOpacity
                    style={styles.addVolunteerButton}
                    onPress={() => navigateToVolunteerSelection()}
                  >
                    <MaterialCommunityIcons name="account-plus" size={16} color="#E30000" />
                    <Text style={styles.addVolunteerText}>Aggiungi</Text>
                  </TouchableOpacity>
                </View>

                {Object.entries(squadreRaggruppate).map(([squadraId, membri]) => (
                  <View key={squadraId} style={styles.squadraCard}>
                    <View style={styles.squadraHeader}>
                      <View style={styles.squadraInfo}>
                        <MaterialCommunityIcons name="account-group" size={20} color="#E30000" />
                        <Text style={styles.squadraNome}>{squadraId}</Text>
                        <View style={styles.squadraBadge}>
                          <Text style={styles.squadraBadgeText}>{membri.length}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.editSquadraButton}
                        onPress={() => navigateToVolunteerSelection(squadraId)}
                      >
                        <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.membriContainer}>
                      {membri.map((membro) => (
                        <View key={membro.id} style={styles.membroCard}>
                          <View style={styles.membroInfo}>
                            <Text style={styles.membroNome}>{membro.userName}</Text>
                            <Text style={styles.membroEmail}>{membro.userEmail}</Text>
                          </View>
                          {membro.ruolo === 'coordinatore' && (
                            <View style={styles.coordinatoreBadge}>
                              <MaterialCommunityIcons name="star" size={12} color="#FFA500" />
                              <Text style={styles.coordinatoreText}>Coord</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E30000" />
          <Text style={styles.loadingText}>Caricamento evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* DEBUG INFO BANNER */}
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              📁 File: EventDetailScreen.tsx | 🔧 {isAdmin ? 'Admin Debug Mode' : 'User Debug Mode'}
            </Text>
          </View>

          {/* Header con permessi */}
          <View style={styles.permissionsBanner}>
            <Text style={styles.permissionsText}>
              {isAdmin ? '👑 Modalità Responsabile' : '👁️ Modalità Visualizzazione'} 
              - {nome} {cognome}
            </Text>
          </View>

          {/* Informazioni base */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Informazioni Evento</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Nome Evento *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={nomeEvento}
                  onChangeText={setNomeEvento}
                  placeholder="Inserisci nome evento"
                />
              ) : (
                <Text style={styles.value}>{event.nomeEvento}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Località *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={localita}
                  onChangeText={setLocalita}
                  placeholder="Inserisci località"
                />
              ) : (
                <Text style={styles.value}>{event.localita}</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Data Evento</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={dataEvento}
                    onChangeText={setDataEvento}
                    placeholder="gg/mm/aaaa"
                  />
                ) : (
                  <Text style={styles.value}>{event.dataEvento || 'Non specificata'}</Text>
                )}
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Livello</Text>
                {isEditing ? (
                  <View style={styles.levelContainer}>
                    {(['Low', 'Medium', 'High'] as const).map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.levelButton,
                          { backgroundColor: livello === level ? getLevelColor(level) : '#F0F0F0' }
                        ]}
                        onPress={() => setLivello(level)}
                      >
                        <Text style={[
                          styles.levelButtonText,
                          { color: livello === level ? 'white' : '#333' }
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(event.livello || 'Low') }]}>
                    <Text style={styles.levelText}>{event.livello || 'Low'}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Ora Inizio</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={oraInizio}
                    onChangeText={setOraInizio}
                    placeholder="hh:mm"
                  />
                ) : (
                  <Text style={styles.value}>{event.oraInizio || 'Non specificata'}</Text>
                )}
              </View>

              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Ora Fine</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={oraFine}
                    onChangeText={setOraFine}
                    placeholder="hh:mm"
                  />
                ) : (
                  <Text style={styles.value}>{event.oraFine || 'Non specificata'}</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Note</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Note aggiuntive..."
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.value}>{event.note || 'Nessuna nota'}</Text>
              )}
            </View>
          </View>

          {/* NUOVO: Sezione gestione volontari - solo admin */}
          {renderGestioneVolontari()}

          {/* Sezione configurazione squadre - solo admin */}
          <AdminOnly>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Configurazione Avanzata</Text>
              
              <TouchableOpacity
                style={styles.configButton}
                onPress={navigateToTeamConfig}
              >
                <MaterialCommunityIcons name="cog" size={24} color="#E30000" />
                <View style={styles.configButtonContent}>
                  <Text style={styles.configButtonTitle}>Configurazioni Tecniche</Text>
                  <Text style={styles.configButtonSubtitle}>Health Points e impostazioni avanzate</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </AdminOnly>

          {/* NUOVO: Sezione Zona Pericolosa - CANCELLAZIONE EVENTO */}
          <AdminOnly>
            <View style={[styles.section, styles.dangerZone]}>
              <View style={styles.dangerZoneHeader}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#E30000" />
                <Text style={styles.dangerZoneTitle}>⚠️ Zona Pericolosa</Text>
              </View>
              <Text style={styles.dangerZoneSubtitle}>
                Azioni irreversibili che non possono essere annullate
              </Text>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteEvent}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete-forever" size={20} color="white" />
                    <Text style={styles.deleteButtonText}>CANCELLA EVENTO DEFINITIVAMENTE</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <Text style={styles.deleteWarning}>
                ⚠️ Questa azione cancellerà permanentemente l'evento, tutte le configurazioni e le assegnazioni volontari.
              </Text>
            </View>
          </AdminOnly>

          {/* Informazioni evento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Dettagli Tecnici</Text>
            <Text style={styles.infoText}>
              Creato da: {event.createdBy}
            </Text>
            {event.lastModifiedBy && (
              <Text style={styles.infoText}>
                Ultima modifica: {event.lastModifiedBy}
              </Text>
            )}
          </View>

        </ScrollView>

        {/* Pulsanti azione - solo admin - FIXED STYLING */}
        <AdminOnly>
          <View style={styles.actionButtons}>
            {isEditing ? (
              <View style={styles.editingButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={cancelEditing}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={saveChanges}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salva</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={startEditing}
                activeOpacity={0.8}
              >
                <View style={styles.editButtonContent}>
                  <MaterialCommunityIcons name="pencil" size={20} color="white" />
                  <Text style={styles.editButtonText}>Modifica Evento</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </AdminOnly>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  // DEBUG BANNER - NUOVO
  debugBanner: {
    backgroundColor: '#FFF9C4',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F57F17',
  },
  debugText: {
    fontSize: 12,
    color: '#F57F17',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  permissionsBanner: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  permissionsText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // NUOVO: Styling zona pericolosa
  dangerZone: {
    borderLeftWidth: 4,
    borderLeftColor: '#E30000',
    backgroundColor: '#FFF8F8',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000',
  },
  dangerZoneSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E30000',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#E30000',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  // NUOVO: Styling per gestione volontari
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  activateButton: {
    backgroundColor: '#28A745',
  },
  disableButton: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    color: '#28A745',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingAssegnazioni: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  noAssegnazioni: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  noAssegnazioniText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  configuraButton: {
    backgroundColor: '#E30000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  configuraButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  assegnazioniContainer: {
    gap: 16,
  },
  assegnazioniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assegnazioniTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  addVolunteerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVolunteerText: {
    color: '#E30000',
    fontWeight: '600',
    fontSize: 14,
  },
  squadraCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E30000',
  },
  squadraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  squadraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadraNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  squadraBadge: {
    backgroundColor: '#E30000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadraBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editSquadraButton: {
    padding: 4,
  },
  membriContainer: {
    gap: 8,
  },
  membroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
  },
  membroInfo: {
    flex: 1,
  },
  membroNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  membroEmail: {
    fontSize: 12,
    color: '#666',
  },
  coordinatoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coordinatoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  // Styling esistente
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  configButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  configButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  configButtonSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    minHeight: 80,
  },
  editingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  editButton: {
    backgroundColor: '#E30000',
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#28A745',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;