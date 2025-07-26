// src/screens/VolunteerSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VolunteerSelectionScreenProps } from '../types/navigation';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isSelected: boolean;
  currentTeam?: string;
}

const VolunteerSelectionScreen: React.FC<VolunteerSelectionScreenProps> = ({ route, navigation }) => {
  const { eventId, teamId } = route.params;
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVolunteers();
    loadTeamInfo();
  }, []);

  const loadVolunteers = async () => {
    try {
      // TODO: Caricare volontari da Firebase
      // Per ora usiamo dati di esempio
      const mockVolunteers: Volunteer[] = [
        {
          id: '1',
          name: 'Vincenzo Russo',
          email: 'vincenzo.russo@cri.it',
          role: 'admin',
          isSelected: false,
          currentTeam: 'SAP-001',
        },
        {
          id: '2',
          name: 'Maria Verdi',
          email: 'maria.verdi@cri.it',
          role: 'user',
          isSelected: false,
          currentTeam: 'SAP-001',
        },
        {
          id: '3',
          name: 'Antonio Esposito',
          email: 'antonio.esposito@cri.it',
          role: 'user',
          isSelected: false,
          currentTeam: 'SAP-002',
        },
        {
          id: '4',
          name: 'Luigi Mollo',
          email: 'luigi.mollo@cri.it',
          role: 'user',
          isSelected: false,
        },
        {
          id: '5',
          name: 'Antonio Abete',
          email: 'antonio.abete@cri.it',
          role: 'user',
          isSelected: false,
        },
        {
          id: '6',
          name: 'Mario De Luca',
          email: 'mario.deluca@cri.it',
          role: 'user',
          isSelected: false,
        },
        {
          id: '7',
          name: 'Antonio Mimma',
          email: 'antonio.mimma@cri.it',
          role: 'user',
          isSelected: false,
        },
      ];

      setVolunteers(mockVolunteers);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento volontari:', error);
      Alert.alert('Errore', 'Impossibile caricare i volontari');
      setLoading(false);
    }
  };

  const loadTeamInfo = async () => {
    if (teamId) {
      // TODO: Caricare info squadra da Firebase
      setTeamName(`SAP-${teamId.padStart(3, '0')}`);
      
      // TODO: Preselezionare membri esistenti
      // setSelectedVolunteers(existingMembers);
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

    try {
      // TODO: Salvare configurazione squadra su Firebase
      console.log('Salvataggio squadra:', {
        eventId,
        teamId,
        teamName,
        members: selectedVolunteers,
      });

      Alert.alert(
        'Successo',
        `Squadra ${teamName} configurata con ${selectedVolunteers.length} membri`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare la configurazione');
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderVolunteerItem = ({ item }: { item: Volunteer }) => {
    const isSelected = selectedVolunteers.includes(item.id);
    const hasTeam = Boolean(item.currentTeam && item.currentTeam !== teamName);

    return (
      <TouchableOpacity
        style={[
          styles.volunteerCard,
          isSelected && styles.volunteerCardSelected,
          hasTeam && styles.volunteerCardInTeam,
        ]}
        onPress={() => handleVolunteerToggle(item.id)}
        disabled={hasTeam}
        activeOpacity={hasTeam ? 1 : 0.7}
      >
        <View style={styles.volunteerInfo}>
          <Text style={[
            styles.volunteerName,
            isSelected && styles.volunteerNameSelected,
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.volunteerEmail,
            isSelected && styles.volunteerEmailSelected,
          ]}>
            {item.email}
          </Text>
          {item.currentTeam && (
            <Text style={styles.currentTeam}>
              {item.currentTeam === teamName ? 'Membro corrente' : `Già in ${item.currentTeam}`}
            </Text>
          )}
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
            color={isSelected ? '#28A745' : '#CCC'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento volontari...</Text>
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
        <Text style={styles.headerTitle}>Configura {teamName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>
            Seleziona Volontari ({selectedVolunteers.length} selezionati)
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca volontario..."
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
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              Salva Configurazione ({selectedVolunteers.length} membri)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  volunteerCardInTeam: {
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
  volunteerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  volunteerEmailSelected: {
    color: '#28A745',
  },
  currentTeam: {
    fontSize: 12,
    color: '#FFA500',
    fontStyle: 'italic',
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VolunteerSelectionScreen;