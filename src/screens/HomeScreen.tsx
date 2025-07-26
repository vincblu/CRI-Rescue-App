// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useRef } from 'react'; // <--- AGGIUNTO: useRef
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated, // <--- AGGIUNTO: Animated per animazioni
  Vibration // <--- AGGIUNTO: Vibration (alternativa a Haptics se non vuoi installare un'altra lib)
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // <--- AGGIUNTO: Importa expo-haptics

// Services
import { getEvents, createEvent, Event } from '../services/eventService';

// Context
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/AuthContext'; // Mantieni usePermissions per consistenza, anche se potresti destrutturare da useAuth
import { AdminOnly } from '../context/AuthContext';

// Types
import { AppNavigation } from '../types/navigation';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigation>();
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const { nome, cognome } = usePermissions(); // Mantenuto per chiarezza, come nel tuo codice precedente

  // Stati componente
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stati per creazione evento (solo admin)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nomeEvento, setNomeEvento] = useState('');
  const [localita, setLocalita] = useState('');
  const [creating, setCreating] = useState(false);

  // --- AGGIUNTO: Stati e Ref per Pressione Prolungata e Animazione ---
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressProgress = useRef(new Animated.Value(0)).current; // Per l'animazione radiale/progress bar
  const [isPressingEventId, setIsPressingEventId] = useState<string | null>(null); // Traccia quale evento è in pressione
  // --- FINE AGGIUNTO ---

  // Carica eventi all'avvio e quando torna focus
  const loadEvents = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const eventsData = await getEvents();
      setEvents(eventsData);
      console.log('📅 Eventi caricati:', eventsData.length);
    } catch (error) {
      console.error('❌ Errore caricamento eventi:', error);
      Alert.alert('Errore', 'Impossibile caricare gli eventi');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh quando la schermata riceve focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 HomeScreen in focus - ricaricamento eventi');
      loadEvents();
    }, [])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadEvents(false);
  };

  // Creazione nuovo evento (solo admin)
  const handleCreateEvent = async () => {
    // Aggiunto il controllo per il loading del contesto di autenticazione
    if (authLoading) { // Se l'autenticazione è ancora in corso, non permettere l'azione
      Alert.alert('Attendere', 'Caricamento delle informazioni utente in corso. Riprova tra un istante.');
      return;
    }

    // Qui usi direttamente isAdmin che viene da useAuth
    if (!isAdmin) { 
      Alert.alert('Accesso Negato', 'Non hai i permessi per creare eventi');
      return;
    }

    if (!nomeEvento.trim() || !localita.trim()) {
      Alert.alert('Errore', 'Inserisci nome evento e località');
      return;
    }

    try {
      setCreating(true);
      
      await createEvent({
        nomeEvento: nomeEvento.trim(),
        localita: localita.trim(),
        createdBy: currentUser?.email || 'Unknown' 
      });

      console.log('✅ Evento creato con successo');
      
      // Reset form e chiudi modal
      setNomeEvento('');
      setLocalita('');
      setShowCreateModal(false);
      
      // Ricarica lista eventi
      await loadEvents();
      
      Alert.alert('Successo', 'Evento creato con successo!');
      
    } catch (error) {
      console.error('❌ Errore creazione evento:', error);
      Alert.alert('Errore', 'Impossibile creare l\'evento');
    } finally {
      setCreating(false);
    }
  };

  // --- AGGIUNTO: Logica per Pressione Prolungata ---
  const handlePressIn = (eventItem: Event) => {
    if (!isAdmin) return; 

    setIsPressingEventId(eventItem.id); // Inizia a tracciare l'evento in pressione
    pressProgress.setValue(0); 
    Animated.timing(pressProgress, {
      toValue: 1,
      duration: 3000, 
      useNativeDriver: false, 
    }).start();

    longPressTimer.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
      setIsPressingEventId(null); 
      
      navigation.navigate('EventDetail', { 
        eventId: eventItem.id, 
        event: eventItem,
        initialMode: 'edit' 
      });
      pressProgress.setValue(0); 
    }, 3000); 
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    Animated.timing(pressProgress, {
      toValue: 0,
      duration: 200, 
      useNativeDriver: false,
    }).start(() => setIsPressingEventId(null)); 
  };

  // --- CORREZIONE: Interpola il colore dello sfondo per l'animazione ---
  // Aggiunto un controllo per assicurare che l'interpolazione restituisca solo stringhe di colore
  const animatedBackgroundColor = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', '#FFDDC2'] // Da bianco a un arancione chiaro
  }) as Animated.AnimatedInterpolation<string>; // <--- AGGIUNTO: Cast esplicito per il tipo

  // --- FINE AGGIUNTO: Logica per Pressione Prolungata ---

  // Navigazione dettaglio evento (modificata per gestione onLongPress)
  const navigateToDetail = (event: Event) => {
    // Se è Admin e un evento è in pressione (per longPress), non navigare normalmente per evitare conflitti
    if (isAdmin && isPressingEventId) {
        return; 
    }
    // Naviga normalmente in visualizzazione
    navigation.navigate('EventDetail', { 
        eventId: event.id, 
        event: event,
        initialMode: 'view' 
    });
  };

  // Render item evento (modificato per Pressione Prolungata)
  const renderEventItem = ({ item }: { item: Event }) => {
    const isThisEventBeingPressed = isPressingEventId === item.id;
    
    return (
      // CORREZIONE: Usa Animated.View per applicare stili animati
      // L'Animated.View riceve gli stili animati
      <Animated.View 
        style={[
            styles.eventCard,
            isAdmin && isThisEventBeingPressed && { backgroundColor: animatedBackgroundColor }, 
        ]}
      >
        {/* TouchableOpacity gestisce i press event e occupa tutto lo spazio */}
        <TouchableOpacity 
            onLongPress={() => {}} // Necessario per attivare onLongPress (anche se gestito da PressIn)
            onPressIn={() => handlePressIn(item)} 
            onPressOut={handlePressOut} 
            onPress={() => navigateToDetail(item)} 
            activeOpacity={0.8}
            style={styles.eventCardInnerTouchable} // <--- NUOVO STILE: Per riempire il container
        >
          {/* Contenuto della scheda evento */}
          <View style={styles.eventHeader}>
            <Text style={styles.eventName}>{item.nomeEvento}</Text>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color="#E30000" 
            />
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={16} 
                color="#666" 
              />
              <Text style={styles.eventText}>{item.localita}</Text>
            </View>
            
            {item.dataEvento && (
              <View style={styles.eventDetail}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color="#666" 
                />
                <Text style={styles.eventText}>{item.dataEvento}</Text>
              </View>
            )}
            
            {item.livello && (
              <View style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(item.livello) }
              ]}>
                <Text style={styles.levelText}>{item.livello}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  // Fine renderEventItem

  // Colore badge livello
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return '#28A745';
      case 'Medium': return '#FFA500';
      case 'High': return '#E30000';
      default: return '#6C757D';
    }
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E30000" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Caricamento utente...' : 'Caricamento eventi...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con info utente */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Ciao, {nome} {cognome}
          </Text>
          <Text style={styles.roleText}>
            {isAdmin ? '👑 Responsabile' : '🚑 Volontario'} 
            {/* squadraNome non è presente in usePermissions nel codice fornito */}
            {/* {squadraNome && ` - ${squadraNome}`} */}
          </Text>
        </View>
        
        {/* Pulsante crea evento - solo admin */}
        <AdminOnly>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <MaterialCommunityIcons 
              name="plus" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </AdminOnly>
      </View>

      {/* Lista eventi */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          📅 Eventi {isAdmin ? '(Gestisci)' : '(Visualizza)'}
        </Text>
        
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="calendar-outline" 
              size={64} 
              color="#CCC" 
            />
            <Text style={styles.emptyText}>Nessun evento disponibile</Text>
            <AdminOnly>
              <Text style={styles.emptySubText}>
                Crea il primo evento per iniziare
              </Text>
            </AdminOnly>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer} 
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#E30000']}
              />
            }
          />
        )}
      </View>

      {/* Modal creazione evento - solo admin */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuovo Evento</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome evento"
              value={nomeEvento}
              onChangeText={setNomeEvento}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Località"
              value={localita}
              onChangeText={setLocalita}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.createEventButton]}
                onPress={handleCreateEvent}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Crea</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#E30000',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listContentContainer: { 
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: 'white', 
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', 
  },
  // NUOVO STILE per TouchableOpacity interno
  eventCardInnerTouchable: {
    flex: 1, 
    padding: 16, // Aggiunto padding qui per contenere il contenuto della card
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventText: {
    fontSize: 14,
    color: '#666',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  createEventButton: {
    backgroundColor: '#E30000',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;