// src/screens/EventDetailScreen.tsx - UI MIGLIORATA
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, usePermissions } from '../context/AuthContext';
import { getUserById } from '../services/userService';
import { updateEvent, deleteEvent } from '../services/eventService';
import type { EventDetailScreenProps } from '../types/navigation';

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId, event: initialEvent } = route.params;
  const { user } = useAuth();
  const permissions = usePermissions();
  
  // ==================== STATE ====================
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Event data state
  const [event, setEvent] = useState(initialEvent || {
    nomeEvento: '',
    localita: '',
    dataEvento: '',
    oraInizio: '',
    oraFine: '',
    livello: 'Low' as 'Low' | 'Medium' | 'High',
    note: ''
  });

  // ==================== NAVIGATION HEADER CONFIG ====================
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // 🚫 NASCONDE la header di React Navigation
    });
  }, [navigation]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadUserData();
  }, [user]);

  // ==================== DATA LOADING ====================
  const loadUserData = async () => {
    if (!user?.uid) return;
    
    try {
      const userInfo = await getUserById(user.uid);
      setUserData(userInfo);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // Fallback con dati minimi per evitare errori
      setUserData({
        nome: user.email?.split('@')[0] || 'User',
        cognome: 'CRI',
        role: 'user'
      });
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatDateInput = (text: string) => {
    // Rimuove caratteri non numerici
    const cleaned = text.replace(/\D/g, '');
    
    // Applica formato DD/MM/YYYY
    if (cleaned.length >= 2) {
      const day = cleaned.substring(0, 2);
      const month = cleaned.substring(2, 4);
      const year = cleaned.substring(4, 8);
      
      if (cleaned.length <= 2) return day;
      if (cleaned.length <= 4) return `${day}/${month}`;
      return `${day}/${month}/${year}`;
    }
    
    return cleaned;
  };

  const formatTimeInput = (text: string) => {
    // Rimuove caratteri non numerici
    const cleaned = text.replace(/\D/g, '');
    
    // Applica formato HH:MM con gestione intelligente
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned;
    if (cleaned.length === 2) return cleaned;
    if (cleaned.length === 3) {
      // ✅ 123 → 12:30 (aggiunge zero finale)
      const hours = cleaned.substring(0, 2);
      const minute = cleaned.substring(2, 3);
      return `${hours}:${minute}0`;
    }
    if (cleaned.length >= 4) {
      // ✅ 1234 → 12:34 (formato completo)
      const hours = cleaned.substring(0, 2);
      const minutes = cleaned.substring(2, 4);
      return `${hours}:${minutes}`;
    }
    
    return cleaned;
  };

  // ==================== HANDLERS ====================
  const handleSave = async () => {
    if (!event.nomeEvento.trim() || !event.localita.trim()) {
      Alert.alert('Errore', 'Nome evento e località sono obbligatori');
      return;
    }

    if (!permissions.canModifyEvents) {
      Alert.alert('Errore', 'Non hai i permessi per modificare eventi');
      return;
    }

    setLoading(true);
    
    try {
      const updateData = {
        ...event,
        lastModifiedBy: userData?.nome && userData?.cognome 
          ? `${userData.nome} ${userData.cognome}`
          : user?.email || 'Unknown'
      };

      await updateEvent(eventId, updateData);
      
      Alert.alert('✅ Successo', 'Evento aggiornato correttamente', [
        { 
          text: 'OK', 
          onPress: () => {
            setEditMode(false);
            navigation.goBack();
          }
        }
      ]);
      
    } catch (error) {
      console.error('❌ Error updating event:', error);
      Alert.alert('❌ Errore', 'Impossibile aggiornare l\'evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!permissions.canModifyEvents) {
      Alert.alert('Errore', 'Non hai i permessi per eliminare eventi');
      return;
    }

    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteEvent(eventId);
              Alert.alert('✅ Successo', 'Evento eliminato correttamente');
              navigation.goBack();
            } catch (error) {
              console.error('❌ Error deleting event:', error);
              Alert.alert('❌ Errore', 'Impossibile eliminare l\'evento');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTeamConfiguration = () => {
    navigation.navigate('TeamConfiguration', { eventId });
  };

  // ==================== RENDER HELPERS ====================
  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    multiline?: boolean,
    keyboardType?: 'default' | 'numeric' | 'phone-pad',
    maxLength?: number
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldLabelContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editMode && permissions.canModifyEvents && (
          <MaterialCommunityIcons 
            name="pencil" 
            size={14} 
            color="#E30000" 
            style={styles.editIcon}
          />
        )}
      </View>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.fieldInputMultiline,
          editMode && permissions.canModifyEvents && styles.fieldInputEditing,
          !editMode && styles.fieldInputReadonly
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        editable={editMode && permissions.canModifyEvents}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );

  const renderDateTimeRow = () => (
    <View style={styles.dateTimeContainer}>
      <Text style={styles.sectionTitle}>📅 Programmazione Evento</Text>
      
      <View style={styles.dateTimeRow}>
        {/* Data Evento - PIÙ LARGA */}
        <View style={[styles.dateTimeField, styles.dateFieldWide]}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>Data *</Text>
            {editMode && permissions.canModifyEvents && (
              <MaterialCommunityIcons name="calendar" size={14} color="#E30000" />
            )}
          </View>
          <TextInput
            style={[
              styles.fieldInput,
              styles.dateTimeInput,
              editMode && permissions.canModifyEvents && styles.fieldInputEditing,
              !editMode && styles.fieldInputReadonly
            ]}
            value={event.dataEvento || ''}
            onChangeText={(text) => setEvent({ ...event, dataEvento: formatDateInput(text) })}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#999"
            editable={editMode && permissions.canModifyEvents}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Ora Inizio - PIÙ STRETTA */}
        <View style={[styles.dateTimeField, styles.timeFieldNarrow]}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>Inizio</Text>
            {editMode && permissions.canModifyEvents && (
              <MaterialCommunityIcons name="clock-start" size={14} color="#E30000" />
            )}
          </View>
          <TextInput
            style={[
              styles.fieldInput,
              styles.dateTimeInput,
              editMode && permissions.canModifyEvents && styles.fieldInputEditing,
              !editMode && styles.fieldInputReadonly
            ]}
            value={event.oraInizio || ''}
            onChangeText={(text) => setEvent({ ...event, oraInizio: formatTimeInput(text) })}
            placeholder="HH:MM"
            placeholderTextColor="#999"
            editable={editMode && permissions.canModifyEvents}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        {/* Ora Fine - PIÙ STRETTA */}
        <View style={[styles.dateTimeField, styles.timeFieldNarrow]}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>Fine</Text>
            {editMode && permissions.canModifyEvents && (
              <MaterialCommunityIcons name="clock-end" size={14} color="#E30000" />
            )}
          </View>
          <TextInput
            style={[
              styles.fieldInput,
              styles.dateTimeInput,
              editMode && permissions.canModifyEvents && styles.fieldInputEditing,
              !editMode && styles.fieldInputReadonly
            ]}
            value={event.oraFine || ''}
            onChangeText={(text) => setEvent({ ...event, oraFine: formatTimeInput(text) })}
            placeholder="HH:MM"
            placeholderTextColor="#999"
            editable={editMode && permissions.canModifyEvents}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );

  const renderLevelPicker = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldLabelContainer}>
        <Text style={styles.fieldLabel}>Livello Complessità</Text>
        {editMode && permissions.canModifyEvents && (
          <MaterialCommunityIcons name="alert-circle" size={14} color="#E30000" />
        )}
      </View>
      <View style={styles.levelContainer}>
        {(['Low', 'Medium', 'High'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelButton,
              event.livello === level && styles.levelButtonActive,
              (!editMode || !permissions.canModifyEvents) && styles.levelButtonDisabled,
              editMode && permissions.canModifyEvents && styles.levelButtonEditing
            ]}
            onPress={() => editMode && permissions.canModifyEvents && setEvent({ ...event, livello: level })}
            disabled={!editMode || !permissions.canModifyEvents}
          >
            <Text style={[
              styles.levelButtonText,
              event.livello === level && styles.levelButtonTextActive
            ]}>
              {level}
            </Text>
            {event.livello === level && (
              <MaterialCommunityIcons name="check" size={16} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E30000" />
        <Text style={styles.loadingText}>Operazione in corso...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔴 HEADER COMPATTA ROSSA */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dettaglio Evento</Text>
          {editMode && (
            <View style={styles.editModeIndicator}>
              <MaterialCommunityIcons name="pencil" size={12} color="white" />
              <Text style={styles.editModeText}>MODIFICA</Text>
            </View>
          )}
        </View>
        
        {permissions.canModifyEvents && (
          <TouchableOpacity
            style={[styles.editButton, editMode && styles.editButtonActive]}
            onPress={() => setEditMode(!editMode)}
          >
            <MaterialCommunityIcons 
              name={editMode ? "check" : "pencil"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContent}>
        {/* Modalità Edit Alert */}
        {editMode && permissions.canModifyEvents && (
          <View style={styles.editAlert}>
            <MaterialCommunityIcons name="information" size={20} color="#E30000" />
            <Text style={styles.editAlertText}>
              Modalità modifica attiva. I campi sono ora editabili.
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {renderField(
            'Nome Evento *',
            event.nomeEvento,
            (text) => setEvent({ ...event, nomeEvento: text }),
            'Es: Concerto Estate 2024'
          )}

          {renderField(
            'Località *',
            event.localita,
            (text) => setEvent({ ...event, localita: text }),
            'Es: Piazza del Comune, Napoli'
          )}

          {renderDateTimeRow()}

          {renderLevelPicker()}

          {renderField(
            'Note Aggiuntive',
            event.note || '',
            (text) => setEvent({ ...event, note: text }),
            'Inserisci informazioni aggiuntive per l\'evento...',
            true
          )}
        </View>

        {/* Action Buttons */}
        {permissions.canModifyEvents && (
          <View style={styles.actionContainer}>
            {editMode && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                <MaterialCommunityIcons name="content-save" size={20} color="white" />
                <Text style={styles.saveButtonText}>Salva Modifiche</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.teamButton}
              onPress={handleTeamConfiguration}
            >
              <MaterialCommunityIcons name="account-group" size={20} color="white" />
              <Text style={styles.teamButtonText}>Configura Squadre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={loading}
            >
              <MaterialCommunityIcons name="delete" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Elimina Evento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Informazioni Evento</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Evento:</Text>
            <Text style={styles.infoValue}>{eventId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ultima Modifica:</Text>
            <Text style={styles.infoValue}>
              {userData?.nome && userData?.cognome 
                ? `${userData.nome} ${userData.cognome}`
                : user?.email || 'N/A'
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },

  // 🔴 HEADER SUPER-COMPATTA ROSSA
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4, // ✅ ULTRA-RIDOTTO da 6 a 4
    paddingTop: 46, // ✅ MINIMO per safe area
    backgroundColor: '#E30000',
    borderBottomWidth: 1,
    borderBottomColor: '#B91C1C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  backButton: {
    padding: 8,
    borderRadius: 20,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // ✅ INDICATORE MODALITÀ EDIT
  editModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },

  editModeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },

  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  editButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ✅ ALERT MODALITÀ EDIT
  editAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E30000',
    gap: 8,
  },

  editAlertText: {
    flex: 1,
    fontSize: 14,
    color: '#E30000',
    fontWeight: '500',
  },

  // Content scrollabile
  scrollContent: {
    flex: 1,
  },

  // Form
  formContainer: {
    padding: 16,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  // ✅ LABEL CON ICONA EDIT
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  editIcon: {
    opacity: 0.7,
  },

  fieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },

  // ✅ STILI MODALITÀ EDIT/READONLY
  fieldInputEditing: {
    borderColor: '#E30000',
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },

  fieldInputReadonly: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E9ECEF',
  },

  fieldInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },

  // ✅ SEZIONE DATA/ORA MIGLIORATA
  dateTimeContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  dateTimeField: {
    flex: 1,
  },

  // ✅ PROPORZIONI OTTIMIZZATE
  dateFieldWide: {
    flex: 2, // Data prende il doppio dello spazio
  },

  timeFieldNarrow: {
    flex: 1, // Ore prendono spazio normale
  },

  dateTimeInput: {
    textAlign: 'center',
    fontWeight: '600',
  },

  // Level Picker MIGLIORATO
  levelContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  levelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    gap: 4,
  },

  levelButtonActive: {
    backgroundColor: '#E30000',
    borderColor: '#E30000',
  },

  levelButtonDisabled: {
    opacity: 0.6,
  },

  // ✅ STILE EDIT MODE PER LEVEL
  levelButtonEditing: {
    borderWidth: 2,
    borderColor: '#FFA500',
  },

  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  levelButtonTextActive: {
    color: 'white',
  },

  // Action Buttons
  actionContainer: {
    padding: 16,
    gap: 12,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  teamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },

  teamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },

  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Info Section
  infoContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },

  infoLabel: {
    fontSize: 14,
    color: '#666',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
});

export default EventDetailScreen;
