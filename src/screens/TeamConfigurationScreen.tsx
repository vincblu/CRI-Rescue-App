// src/screens/TeamConfigurationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TeamConfigurationScreenProps } from '../types/navigation';

interface Team {
  id: string;
  name: string;
  members: string[];
  status: 'Libera' | 'Intervento' | 'Trasferimento';
}

interface HealthPoint {
  id: string;
  name: string;
  type: 'Tenda' | 'Furgone' | 'Ambulanza' | 'Struttura';
  status: 'Libero' | 'Ricezione' | 'Intervento';
  location?: string;
}

const TeamConfigurationScreen: React.FC<TeamConfigurationScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [healthPoints, setHealthPoints] = useState<HealthPoint[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isAddingHP, setIsAddingHP] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newHPName, setNewHPName] = useState('');
  const [newHPType, setNewHPType] = useState<HealthPoint['type']>('Tenda');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    // TODO: Caricare configurazione da Firebase
    // Per ora usiamo dati di esempio
    setTeams([
      {
        id: '1',
        name: 'SAP-001',
        members: ['Vincenzo Russo', 'Maria Verdi'],
        status: 'Libera',
      },
      {
        id: '2',
        name: 'SAP-002',
        members: ['Antonio Esposito', 'Luigi Mollo'],
        status: 'Libera',
      },
    ]);

    setHealthPoints([
      {
        id: '1',
        name: 'HP-01',
        type: 'Ambulanza',
        status: 'Libero',
        location: 'Ingresso principale',
      },
      {
        id: '2',
        name: 'HP-02',
        type: 'Tenda',
        status: 'Libero',
        location: 'Area centrale',
      },
    ]);
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome della squadra');
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName.trim(),
      members: [],
      status: 'Libera',
    };

    setTeams(prev => [...prev, newTeam]);
    setNewTeamName('');
    setIsAddingTeam(false);

    // TODO: Salvare su Firebase
    Alert.alert('Successo', 'Squadra creata con successo!');
  };

  const handleAddHP = () => {
    if (!newHPName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del Health Point');
      return;
    }

    const newHP: HealthPoint = {
      id: Date.now().toString(),
      name: newHPName.trim(),
      type: newHPType,
      status: 'Libero',
    };

    setHealthPoints(prev => [...prev, newHP]);
    setNewHPName('');
    setNewHPType('Tenda');
    setIsAddingHP(false);

    // TODO: Salvare su Firebase
    Alert.alert('Successo', 'Health Point creato con successo!');
  };

  const handleEditTeam = (team: Team) => {
    navigation.navigate('VolunteerSelection', { 
      eventId, 
      teamId: team.id 
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler eliminare questa squadra?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            setTeams(prev => prev.filter(t => t.id !== teamId));
            // TODO: Eliminare da Firebase
          },
        },
      ]
    );
  };

  const handleDeleteHP = (hpId: string) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler eliminare questo Health Point?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            setHealthPoints(prev => prev.filter(hp => hp.id !== hpId));
            // TODO: Eliminare da Firebase
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Team['status'] | HealthPoint['status']) => {
    switch (status) {
      case 'Libera':
      case 'Libero':
        return '#28A745';
      case 'Intervento':
        return '#E30000';
      case 'Trasferimento':
      case 'Ricezione':
        return '#FFA500';
      default:
        return '#6C757D';
    }
  };

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditTeam(item)}
          >
            <MaterialCommunityIcons name="account-edit" size={20} color="#E30000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTeam(item.id)}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#E30000" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      
      <Text style={styles.membersText}>
        Membri ({item.members.length}): {item.members.join(', ') || 'Nessuno assegnato'}
      </Text>
    </View>
  );

  const renderHPItem = ({ item }: { item: HealthPoint }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteHP(item.id)}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#E30000" />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      
      <Text style={styles.typeText}>Tipo: {item.type}</Text>
      {item.location && (
        <Text style={styles.locationText}>Posizione: {item.location}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurazione Evento</Text>
      </View>

      {/* Sezione Squadre */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Squadre SAP ({teams.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingTeam(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Nuova</Text>
          </TouchableOpacity>
        </View>

        {isAddingTeam && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome squadra (es. SAP-003)"
              value={newTeamName}
              onChangeText={setNewTeamName}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingTeam(false);
                  setNewTeamName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddTeam}
              >
                <Text style={styles.confirmButtonText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={teams}
          renderItem={renderTeamItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Sezione Health Points */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Points ({healthPoints.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingHP(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Nuovo</Text>
          </TouchableOpacity>
        </View>

        {isAddingHP && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome Health Point (es. HP-03)"
              value={newHPName}
              onChangeText={setNewHPName}
            />
            
            <Text style={styles.label}>Tipo:</Text>
            <View style={styles.typeSelector}>
              {(['Tenda', 'Furgone', 'Ambulanza', 'Struttura'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newHPType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewHPType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newHPType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingHP(false);
                  setNewHPName('');
                  setNewHPType('Tenda');
                }}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddHP}
              >
                <Text style={styles.confirmButtonText}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={healthPoints}
          renderItem={renderHPItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  section: {
    margin: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E30000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  addForm: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  typeButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  typeButtonActive: {
    backgroundColor: '#E30000',
    borderColor: '#E30000',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#CCC',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E30000',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  membersText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
});

export default TeamConfigurationScreen;