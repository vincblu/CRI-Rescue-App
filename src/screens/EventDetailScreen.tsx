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
import { updateEvent, Event } from '../services/eventService';
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
    }
  }, [event]);

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

  // Navigazione configurazione squadre (solo admin)
  const navigateToTeamConfig = () => {
    if (!canModifyEvents) {
      Alert.alert('Accesso Negato', 'Funzionalità riservata ai responsabili');
      return;
    }
    navigation.navigate('TeamConfiguration', { eventId });
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

          {/* Sezione configurazione squadre - solo admin */}
          <AdminOnly>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Configurazione</Text>
              
              <TouchableOpacity
                style={styles.configButton}
                onPress={navigateToTeamConfig}
              >
                <MaterialCommunityIcons name="account-group" size={24} color="#E30000" />
                <View style={styles.configButtonContent}>
                  <Text style={styles.configButtonTitle}>Gestisci Squadre e HP</Text>
                  <Text style={styles.configButtonSubtitle}>Configura SAP e Health Points</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
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

        {/* Pulsanti azione - solo admin */}
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
              >
                <MaterialCommunityIcons name="pencil" size={20} color="white" />
                <Text style={styles.editButtonText}>Modifica Evento</Text>
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
  },
  editingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#E30000',
    flexDirection: 'row',
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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