// src/screens/TeamConfigurationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { TeamConfigurationScreenProps } from '../types/navigation';
import { 
  getSquadreConMembri, 
  deleteSquadra, 
  getNextSquadraNome 
} from '../services/squadraService';
import { SquadraConMembri } from '../types/squadra';
import { auth } from '../config/firebaseConfig';

const TeamConfigurationScreen: React.FC<TeamConfigurationScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  
  const [squadre, setSquadre] = useState<SquadraConMembri[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ricarica dati quando la schermata torna in focus
  useFocusEffect(
    React.useCallback(() => {
      loadSquadre();
    }, [eventId])
  );

  const loadSquadre = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📋 Caricando squadre per evento:', eventId);
      const squadreData = await getSquadreConMembri(eventId);
      setSquadre(squadreData);

      console.log(`✅ Caricate ${squadreData.length} squadre`);

    } catch (error) {
      console.error('❌ Errore caricamento squadre:', error);
      Alert.alert('Errore', 'Impossibile caricare le squadre');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateNewSquadra = async () => {
    try {
      // Genera il prossimo nome squadra disponibile
      const nextNome = await getNextSquadraNome(eventId);
      
      navigation.navigate('VolunteerSelection', {
        eventId,
        nomeSquadra: nextNome,
        isNewSquadra: true,
        membriEsistenti: []
      });
    } catch (error) {
      console.error('❌ Errore creazione squadra:', error);
      Alert.alert('Errore', 'Impossibile creare una nuova squadra');
    }
  };

  const handleEditSquadra = (squadra: SquadraConMembri) => {
    navigation.navigate('VolunteerSelection', {
      eventId,
      squadraId: squadra.id,
      nomeSquadra: squadra.nome,
      isNewSquadra: false,
      membriEsistenti: squadra.membri
    });
  };

  const handleDeleteSquadra = (squadra: SquadraConMembri) => {
    Alert.alert(
      'Elimina Squadra',
      `Sei sicuro di voler eliminare la squadra ${squadra.nome}?\n\nQuesto rimuoverà l'assegnazione di tutti i ${squadra.membri.length} membri.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => confirmDeleteSquadra(squadra.id, squadra.nome),
        },
      ]
    );
  };

  const confirmDeleteSquadra = async (squadraId: string, nomeSquadra: string) => {
    try {
      console.log('🗑️ Eliminando squadra:', squadraId);
      
      const result = await deleteSquadra(squadraId);
      
      if (result.success) {
        Alert.alert('Successo', `Squadra ${nomeSquadra} eliminata con successo`);
        loadSquadre(); // Ricarica la lista
      } else {
        Alert.alert('Errore', result.message);
      }

    } catch (error) {
      console.error('❌ Errore eliminazione squadra:', error);
      Alert.alert('Errore', 'Impossibile eliminare la squadra');
    }
  };

  const renderSquadraItem = ({ item }: { item: SquadraConMembri }) => {
    return (
      <View style={styles.squadraCard}>
        <View style={styles.squadraHeader}>
          <View style={styles.squadraInfo}>
            <Text style={styles.squadraNome}>{item.nome}</Text>
            <Text style={styles.squadraMembri}>
              {item.membri.length} {item.membri.length === 1 ? 'membro' : 'membri'}
            </Text>
          </View>
          
          <View style={styles.squadraActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditSquadra(item)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#007BFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteSquadra(item)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#E30000" />
            </TouchableOpacity>
          </View>
        </View>

        {item.membriDettaglio.length > 0 && (
          <View style={styles.membriContainer}>
            <Text style={styles.membriTitle}>Membri:</Text>
            {item.membriDettaglio.map((membro, index) => (
              <View key={membro.uid} style={styles.membroItem}>
                <Text style={styles.membroNome}>
                  • {membro.displayName || membro.nome}
                </Text>
                {membro.qualifica && (
                  <Text style={styles.membroQualifica}>
                    ({membro.qualifica})
                  </Text>
                )}
                {membro.role === 'admin' && (
                  <View style={styles.adminBadgeSmall}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {item.membri.length === 0 && (
          <View style={styles.emptyMembriContainer}>
            <Text style={styles.emptyMembriText}>
              Nessun membro assegnato
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-group-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>Nessuna squadra configurata</Text>
      <Text style={styles.emptySubtitle}>
        Tocca il pulsante "+" per creare la prima squadra per questo evento
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E30000" />
        <Text style={styles.loadingText}>Caricamento squadre...</Text>
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
        <Text style={styles.headerTitle}>Configurazione Squadre</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{squadre.length}</Text>
            <Text style={styles.statLabel}>Squadre</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {squadre.reduce((total, squadra) => total + squadra.membri.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Volontari</Text>
          </View>
        </View>

        <FlatList
          data={squadre}
          renderItem={renderSquadraItem}
          keyExtractor={(item) => item.id}
          style={styles.squadreList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            squadre.length === 0 && styles.listContentEmpty
          ]}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSquadre(true)}
              colors={['#E30000']}
            />
          }
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNewSquadra}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Crea Nuova Squadra</Text>
        </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E30000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  squadreList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  squadraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  squadraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  squadraInfo: {
    flex: 1,
  },
  squadraNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000',
    marginBottom: 4,
  },
  squadraMembri: {
    fontSize: 14,
    color: '#666',
  },
  squadraActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  membriContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
  membriTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  membroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  membroNome: {
    fontSize: 14,
    color: '#333',
  },
  membroQualifica: {
    fontSize: 12,
    color: '#007BFF',
    fontStyle: 'italic',
  },
  adminBadgeSmall: {
    backgroundColor: '#E30000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyMembriContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
    alignItems: 'center',
  },
  emptyMembriText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TeamConfigurationScreen;