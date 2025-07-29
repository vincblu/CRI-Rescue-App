// src/screens/VolunteerSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VolunteerSelectionScreenProps } from '../types/navigation';
import { 
  getVolontariDisponibili, 
  VolontarioDisponibile,
} from '../services/userService';
import { 
  createSquadra, 
  updateSquadra, 
  assegnaVolontariASquadra,
  getSquadraById,
  getNextSquadraNome 
} from '../services/squadraService';
import { CreateSquadraData } from '../types/squadra';
import { auth } from '../config/firebaseConfig';

// Interfaccia per volontari nella UI (convertita dai dati reali)
interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isSelected: boolean;
  currentTeam?: string;
  qualifica?: string;
  isDisabled?: boolean;
}

const VolunteerSelectionScreen: React.FC<VolunteerSelectionScreenProps> = ({ route, navigation }) => {
  const { 
    eventId, 
    squadraId, 
    teamId, // ← Compatibilità con vecchi parametri
    nomeSquadra, 
    isNewSquadra = true,
    membriEsistenti = [] 
  } = route.params;
  
  // Usa squadraId se disponibile, altrimenti teamId per compatibilità
  const effectiveSquadraId = squadraId || teamId;
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>(membriEsistenti);
  const [teamName, setTeamName] = useState(nomeSquadra || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('👥 Caricando dati reali dal database...');
      
      // Carica volontari disponibili dal database reale
      const volontariDisponibili = await getVolontariDisponibili(eventId);
      
      // Converte i volontari dal format del service al format del componente
      const volunteersFormatted: Volunteer[] = volontariDisponibili.map((volontario) => {
        const isInThisEvent = volontario.eventoAttivo === eventId;
        const isInDifferentEvent = volontario.isAssegnato && !isInThisEvent;
        
        return {
          id: volontario.uid,
          name: volontario.displayName || volontario.nome || 'Nome non disponibile',
          email: volontario.email || 'Email non disponibile',
          role: volontario.role || 'user',
          isSelected: false,
          qualifica: volontario.qualifica,
          currentTeam: isInThisEvent && volontario.squadraAssegnata 
            ? `Squadra ${volontario.squadraAssegnata}` 
            : undefined,
          isDisabled: isInDifferentEvent // Disabilita se assegnato ad altro evento
        };
      });

      console.log(`✅ Caricati ${volunteersFormatted.length} volontari reali`);
      setVolunteers(volunteersFormatted);

      // Se stiamo modificando una squadra esistente, carica i dati
      if (!isNewSquadra && effectiveSquadraId) {
        await loadExistingSquadra();
      } else if (isNewSquadra && !nomeSquadra) {
        // Se stiamo creando una nuova squadra senza nome, genera il prossimo nome
        const nextName = await getNextSquadraNome(eventId);
        setTeamName(nextName);
      }

    } catch (error) {
      console.error('❌ Errore caricamento dati:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati dal database');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSquadra = async () => {
    if (!effectiveSquadraId) return;

    try {
      const squadra = await getSquadraById(effectiveSquadraId);
      if (squadra) {
        setTeamName(squadra.nome);
        setSelectedVolunteers(squadra.membri);
      }
    } catch (error) {
      console.error('❌ Errore caricamento squadra:', error);
    }
  };

  const handleVolunteerToggle = (volunteerId: string) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      } else {
        return [...prev, volunteerId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedVolunteers.length === 0) {
      Alert.alert('Attenzione', 'Seleziona almeno un volontario per la squadra');
      return;
    }

    if (!teamName.trim()) {
      Alert.alert('Attenzione', 'Nome squadra non valido');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Errore', 'Utente non autenticato');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Salvando squadra:', {
        isNewSquadra,
        teamName,
        eventId,
        selectedVolunteers,
        effectiveSquadraId
      });

      if (isNewSquadra) {
        // Crea nuova squadra
        await createNewSquadra(currentUser.uid);
      } else {
        // Aggiorna squadra esistente
        await updateExistingSquadra(currentUser.uid);
      }

      Alert.alert(
        'Successo',
        `Squadra ${teamName} ${isNewSquadra ? 'creata' : 'aggiornata'} con ${selectedVolunteers.length} membri`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.error('❌ Errore salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare la configurazione');
    } finally {
      setSaving(false);
    }
  };

  const createNewSquadra = async (userId: string) => {
    const squadraData: CreateSquadraData = {
      nome: teamName.trim(),
      eventoId: eventId,
      membri: selectedVolunteers,
      createdBy: userId
    };

    console.log('🆕 Creando nuova squadra:', squadraData);
    const result = await createSquadra(squadraData);
    
    if (!result.success) {
      throw new Error(result.message);
    }

    console.log('✅ Squadra creata con successo:', result);
  };

  const updateExistingSquadra = async (userId: string) => {
    if (!effectiveSquadraId) {
      throw new Error('ID squadra mancante');
    }

    console.log('🔄 Aggiornando squadra esistente:', effectiveSquadraId);
    
    // Aggiorna la squadra con i nuovi membri
    const result = await assegnaVolontariASquadra(effectiveSquadraId, selectedVolunteers, eventId);
    
    if (!result.success) {
      throw new Error(result.message);
    }

    console.log('✅ Squadra aggiornata con successo:', result);
  };

  const getVolunteerDisplayInfo = (volunteer: Volunteer) => {
    const isSelected = selectedVolunteers.includes(volunteer.id);

    let statusText = '';
    let statusColor = '#666';

    if (isSelected) {
      statusText = 'Selezionato';
      statusColor = '#28A745';
    } else if (volunteer.currentTeam) {
      statusText = `In ${volunteer.currentTeam}`;
      statusColor = '#FFA500';
    } else if (volunteer.isDisabled) {
      statusText = 'Assegnato ad altro evento';
      statusColor = '#E30000';
    } else {
      statusText = 'Disponibile';
      statusColor = '#28A745';
    }

    return { statusText, statusColor, canSelect: !volunteer.isDisabled };
  };

  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderVolunteerItem = ({ item }: { item: Volunteer }) => {
    const { statusText, statusColor, canSelect } = getVolunteerDisplayInfo(item);
    const isSelected = selectedVolunteers.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.volunteerCard,
          isSelected && styles.volunteerCardSelected,
          !canSelect && styles.volunteerCardDisabled,
        ]}
        onPress={() => canSelect && handleVolunteerToggle(item.id)}
        disabled={!canSelect}
        activeOpacity={canSelect ? 0.7 : 1}
      >
        <View style={styles.volunteerInfo}>
          <Text style={[
            styles.volunteerName,
            isSelected && styles.volunteerNameSelected,
            !canSelect && styles.volunteerNameDisabled,
          ]}>
            {item.name}
          </Text>
          
          <Text style={[
            styles.volunteerEmail,
            isSelected && styles.volunteerEmailSelected,
            !canSelect && styles.volunteerEmailDisabled,
          ]}>
            {item.email}
          </Text>
          
          {item.qualifica && (
            <Text style={styles.volunteerQualifica}>
              {item.qualifica}
            </Text>
          )}
          
          <Text style={[styles.volunteerStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        
        <View style={styles.volunteerActions}>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          
          <MaterialCommunityIcons
            name={isSelected ? 'check-circle' : 'circle-outline'}
            size={24}
            color={
              isSelected 
                ? '#28A745' 
                : canSelect 
                  ? '#CCC' 
                  : '#999'
            }
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E30000" />
        <Text style={styles.loadingText}>Caricamento volontari dal database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewSquadra ? 'Crea' : 'Modifica'} {teamName}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>
            Seleziona Volontari ({selectedVolunteers.length} selezionati)
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca volontario per nome o email..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <FlatList
          data={filteredVolunteers}
          renderItem={renderVolunteerItem}
          keyExtractor={(item) => item.id}
          style={styles.volunteerList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchTerm ? 'Nessun volontario trovato' : 'Nessun volontario disponibile nel database'}
              </Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || selectedVolunteers.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isNewSquadra ? 'Crea' : 'Aggiorna'} Squadra ({selectedVolunteers.length} membri)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#E30000',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  volunteerList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  volunteerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  volunteerCardSelected: {
    borderColor: '#28A745',
    backgroundColor: '#F8FFF9',
  },
  volunteerCardDisabled: {
    backgroundColor: '#F8F8F8',
    opacity: 0.6,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  volunteerNameSelected: {
    color: '#28A745',
  },
  volunteerNameDisabled: {
    color: '#999',
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  volunteerEmailSelected: {
    color: '#28A745',
  },
  volunteerEmailDisabled: {
    color: '#999',
  },
  volunteerQualifica: {
    fontSize: 12,
    color: '#007BFF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  volunteerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  volunteerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBadge: {
    backgroundColor: '#E30000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    margin: -15,
    padding: 15,
  },
  saveButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VolunteerSelectionScreen;