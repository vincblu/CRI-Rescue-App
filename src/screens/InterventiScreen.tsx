// src/screens/InterventiScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Types
interface SquadraState {
  id: string;
  squadraId: string;
  squadraNome: string;
  membri: string[];
  eventoId: string;
  stato: 'libera' | 'intervento' | 'trasferimento';
  interventoAttivoId?: string;
  ultimoAggiornamento: any;
}

interface Intervento {
  id: string;
  squadraId: string;
  squadraNome: string;
  eventoId: string;
  stato: 'attivo' | 'completato' | 'trasferito';
  timestampInizio: any;
  timestampFine?: any;
  note?: string;
}

interface HPState {
  id: string;
  hpId: string;
  nomeHP: string;
  eventoId: string;
  stato: 'libero' | 'ricezione' | 'intervento';
}

// Mock data - da sostituire con servizi reali
const MOCK_SQUADRA: SquadraState = {
  id: '1',
  squadraId: 'SAP-001',
  squadraNome: 'SAP-001',
  membri: ['Vincenzo Russo', 'Maria Verdi'],
  eventoId: 'evento-1',
  stato: 'libera',
  ultimoAggiornamento: new Date(),
};

const MOCK_HP_LIST: HPState[] = [
  {
    id: 'hp1',
    hpId: 'HP-01',
    nomeHP: 'Health Point Centro',
    eventoId: 'evento-1',
    stato: 'libero',
  },
  {
    id: 'hp2', 
    hpId: 'HP-02',
    nomeHP: 'Health Point Nord',
    eventoId: 'evento-1',
    stato: 'libero',
  },
];

export default function InterventiScreen() {
  // State
  const [squadraAttuale, setSquadraAttuale] = useState<SquadraState>(MOCK_SQUADRA);
  const [interventoAttivo, setInterventoAttivo] = useState<Intervento | null>(null);
  const [hpDisponibili, setHpDisponibili] = useState<HPState[]>(MOCK_HP_LIST);
  const [loading, setLoading] = useState(false);

  // Animation per pressione prolungata
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<any>(null);
  const confirmationTriggered = useRef(false);

  // Cleanup al dismount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Colori stati
  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'libera': return '#28A745'; // Verde
      case 'intervento': return '#E30000'; // Rosso CRI
      case 'trasferimento': return '#FFA500'; // Arancione
      default: return '#6C757D'; // Grigio
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'libera': return 'check-circle';
      case 'intervento': return 'medical-bag';
      case 'trasferimento': return 'hospital-building';
      default: return 'help-circle';
    }
  };

  // Long press handler per inizio intervento
  const handleLongPressStart = () => {
    if (squadraAttuale.stato !== 'libera') {
      console.log('❌ Long press bloccato - stato non libera:', squadraAttuale.stato);
      return;
    }
    
    console.log('🔥 Long press iniziato!');
    
    // Reset flags
    confirmationTriggered.current = false;
    
    // Vibrazione feedback inizio
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsLongPressing(true);
    
    // Reset animazione
    progressAnim.setValue(0);
    
    // Avvia animazione
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });
    
    animationRef.current.start(({ finished }: { finished: boolean }) => {
      console.log('🎯 Animazione completata:', { finished });
      
      if (finished && !confirmationTriggered.current) {
        console.log('✅ TRIGGERING CONFERMA INTERVENTO DA ANIMAZIONE!');
        confirmationTriggered.current = true;
        
        // Vibrazione feedback completamento
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Usa setTimeout per assicurarsi che la conferma venga mostrata
        setTimeout(() => {
          confirmInizioIntervento();
        }, 100);
      }
      
      setIsLongPressing(false);
    });
    
    // Timer di sicurezza
    longPressTimer.current = setTimeout(() => {
      if (!confirmationTriggered.current) {
        console.log('⏰ Timer di sicurezza attivato - forzando conferma');
        confirmationTriggered.current = true;
        
        // Vibrazione feedback completamento
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        confirmInizioIntervento();
        setIsLongPressing(false);
      } else {
        console.log('⏰ Timer di sicurezza ignorato - conferma già triggerata');
      }
    }, 3100);
  };

  const handleLongPressEnd = () => {
    console.log('🛑 Long press terminato');
    
    const wasLongPressing = isLongPressing;
    setIsLongPressing(false);
    
    // Se era in corso e non è stata ancora triggerata la conferma, vibrazione di cancellazione
    if (wasLongPressing && !confirmationTriggered.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Ferma animazione
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Pulisci timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Reset animazione
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Conferma inizio intervento
  const confirmInizioIntervento = () => {
    console.log('🚨 Showing confirmation dialog');
    
    // Vibrazione per attirare l'attenzione
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      "🚨 Conferma Intervento",
      `Sei sicuro di voler iniziare un nuovo intervento?\n\nSquadra: ${squadraAttuale.squadraNome}`,
      [
        {
          text: "Annulla",
          style: "cancel",
          onPress: () => {
            console.log('❌ Intervento annullato');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
        {
          text: "CONFERMA",
          style: "destructive",
          onPress: () => {
            console.log('✅ Intervento confermato');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            iniziaIntervento();
          }
        }
      ]
    );
  };

  // Logica inizia intervento
  const iniziaIntervento = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniziando intervento...');
      
      // Vibrazione processamento
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Simula chiamata servizio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const nuovoIntervento: Intervento = {
        id: `int_${Date.now()}`,
        squadraId: squadraAttuale.squadraId,
        squadraNome: squadraAttuale.squadraNome,
        eventoId: squadraAttuale.eventoId,
        stato: 'attivo',
        timestampInizio: new Date(),
      };

      // Aggiorna stato squadra
      const squadraAggiornata = { 
        ...squadraAttuale, 
        stato: 'intervento' as const, 
        interventoAttivoId: nuovoIntervento.id,
        ultimoAggiornamento: new Date()
      };

      console.log('📝 Aggiornando stati:', {
        oldStato: squadraAttuale.stato,
        newStato: squadraAggiornata.stato,
        interventoId: nuovoIntervento.id
      });

      setInterventoAttivo(nuovoIntervento);
      setSquadraAttuale(squadraAggiornata);
      
      // Vibrazione successo finale
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "🚨 INTERVENTO ATTIVO",
        `${squadraAttuale.squadraNome} ha iniziato un intervento alle ${new Date().toLocaleTimeString()}\n\n✅ Stato: INTERVENTO IN CORSO\n🔓 Pulsanti TERMINA e TRASFERIMENTO ora attivi`,
        [{ text: "OK", style: "default" }]
      );
      
    } catch (error) {
      console.error('❌ Errore inizia intervento:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Errore", "Impossibile iniziare l'intervento");
    } finally {
      setLoading(false);
    }
  };

  // Termina intervento
  const terminaIntervento = () => {
    // Vibrazione feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "✅ Termina Intervento",
      "Vuoi concludere l'intervento in corso?",
      [
        { 
          text: "Annulla", 
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: "TERMINA",
          style: "default",
          onPress: async () => {
            try {
              // Vibrazione conferma
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              setLoading(true);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setInterventoAttivo(null);
              setSquadraAttuale(prev => ({ 
                ...prev, 
                stato: 'libera', 
                interventoAttivoId: undefined,
                ultimoAggiornamento: new Date()
              }));
              
              Alert.alert("✅ Intervento Completato", "La squadra è tornata disponibile");
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Errore", "Impossibile terminare l'intervento");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Mostra selezione HP per trasferimento
  const mostraSelezioneHP = () => {
    // Vibrazione feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const hpButtons = hpDisponibili.map(hp => ({
      text: `${hp.hpId} - ${hp.nomeHP}`,
      onPress: () => trasferimentoHP(hp.hpId)
    }));

    Alert.alert(
      "🏥 Seleziona Health Point",
      "Dove vuoi trasferire il paziente?",
      [
        ...hpButtons,
        { 
          text: "Annulla", 
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      ]
    );
  };

  // Trasferimento HP
  const trasferimentoHP = async (hpId: string) => {
    try {
      // Vibrazione feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hpSelezionato = hpDisponibili.find(hp => hp.hpId === hpId);
      
      setSquadraAttuale(prev => ({ 
        ...prev, 
        stato: 'trasferimento',
        ultimoAggiornamento: new Date() 
      }));
      
      // Vibrazione successo
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "🚐 Trasferimento Iniziato", 
        `Trasferimento verso ${hpSelezionato?.nomeHP} in corso`
      );
      
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Errore", "Impossibile iniziare il trasferimento");
    } finally {
      setLoading(false);
    }
  };

  // Renderizza info squadra
  const renderSquadraInfo = () => (
    <View style={styles.squadraInfoContainer}>
      <View style={styles.squadraHeader}>
        <MaterialCommunityIcons 
          name={'account-group' as any}
          size={24} 
          color="#E30000" 
        />
        <Text style={styles.squadraTitle}>La Tua Squadra</Text>
      </View>
      
      <View style={styles.squadraDettagli}>
        <View style={styles.squadraNomeContainer}>
          <Text style={styles.squadraNome}>{squadraAttuale.squadraNome}</Text>
          <View style={[
            styles.statoBadge, 
            { backgroundColor: getStatoColor(squadraAttuale.stato) }
          ]}>
            <MaterialCommunityIcons 
              name={getStatoIcon(squadraAttuale.stato) as any}
              size={16} 
              color="white" 
            />
            <Text style={styles.statoText}>
              {squadraAttuale.stato.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.membriLabel}>Membri:</Text>
        {squadraAttuale.membri.map((membro, index) => (
          <Text key={index} style={styles.membroNome}>
            • {membro}
          </Text>
        ))}
      </View>
    </View>
  );

  // Renderizza pulsanti azioni
  const renderPulsantiAzioni = () => {
    const isInizioDisabled = squadraAttuale.stato !== 'libera' || loading;
    const isTerminaDisabled = squadraAttuale.stato !== 'intervento' || loading;
    const isTrasferimentoDisabled = squadraAttuale.stato !== 'intervento' || loading;

    console.log('🔘 Stati pulsanti:', {
      squadraStato: squadraAttuale.stato,
      inizioDisabled: isInizioDisabled,
      terminaDisabled: isTerminaDisabled,
      trasferimentoDisabled: isTrasferimentoDisabled,
      loading
    });

    return (
      <View style={styles.pulsantiContainer}>
        {/* INIZIO INTERVENTO */}
        <TouchableOpacity
          style={[
            styles.pulsantePrincipale,
            styles.pulsanteInizio,
            isLongPressing && styles.pulsantePressing,
            isInizioDisabled && styles.pulsanteDisabilitato
          ]}
          onPressIn={handleLongPressStart}
          onPressOut={handleLongPressEnd}
          disabled={isInizioDisabled}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={'plus-circle' as any}
            size={28} 
            color="white" 
          />
          <Text style={styles.pulsanteText}>INIZIO INTERVENTO</Text>
          <Text style={[
            styles.pulsanteSubtext,
            isLongPressing && styles.pulsanteSubtextPressing
          ]}>
            {isLongPressing ? 'Tieni premuto...' : 'Tieni premuto 3 secondi'}
          </Text>
          
          {/* Progress bar per long press */}
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
          </View>
          
          {/* Feedback visivo extra */}
          {isLongPressing && (
            <View style={styles.pressingOverlay}>
              <Text style={styles.pressingText}>
                Tieni premuto...
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* TERMINA INTERVENTO */}
        <TouchableOpacity
          style={[
            styles.pulsantePrincipale,
            styles.pulsanteTermina,
            isTerminaDisabled && styles.pulsanteDisabilitato
          ]}
          onPress={terminaIntervento}
          disabled={isTerminaDisabled}
        >
          <MaterialCommunityIcons 
            name={'check-circle' as any}
            size={28} 
            color="white" 
          />
          <Text style={styles.pulsanteText}>TERMINA INTERVENTO</Text>
          <Text style={styles.pulsanteSubtext}>Completa l'intervento</Text>
        </TouchableOpacity>

        {/* TRASFERIMENTO HP */}
        <TouchableOpacity
          style={[
            styles.pulsantePrincipale,
            styles.pulsanteTrasferimento,
            isTrasferimentoDisabled && styles.pulsanteDisabilitato
          ]}
          onPress={mostraSelezioneHP}
          disabled={isTrasferimentoDisabled}
        >
          <MaterialCommunityIcons 
            name={'hospital-building' as any}
            size={28} 
            color="white" 
          />
          <Text style={styles.pulsanteText}>TRASFERIMENTO IN HP</Text>
          <Text style={styles.pulsanteSubtext}>Seleziona Health Point</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizza intervento attivo
  const renderInterventoAttivo = () => {
    if (!interventoAttivo) return null;

    const durata = Math.floor((Date.now() - new Date(interventoAttivo.timestampInizio).getTime()) / 1000 / 60);

    return (
      <View style={styles.interventoAttivoContainer}>
        <View style={styles.interventoHeader}>
          <MaterialCommunityIcons name={'medical-bag' as any} size={24} color="#E30000" />
          <Text style={styles.interventoTitle}>Intervento in Corso</Text>
        </View>
        
        <View style={styles.interventoDettagli}>
          <Text style={styles.interventoInfo}>
            📅 Iniziato: {new Date(interventoAttivo.timestampInizio).toLocaleTimeString()}
          </Text>
          <Text style={styles.interventoInfo}>
            ⏱️ Durata: {durata} minuti
          </Text>
          <Text style={styles.interventoInfo}>
            🆔 ID: {interventoAttivo.id}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={'medical-bag' as any} size={32} color="#E30000" />
        <Text style={styles.headerTitle}>Gestione Interventi</Text>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E30000" />
          <Text style={styles.loadingText}>Elaborazione...</Text>
        </View>
      )}

      {/* Info Squadra */}
      {renderSquadraInfo()}

      {/* Intervento Attivo */}
      {renderInterventoAttivo()}

      {/* Pulsanti Azioni */}
      {renderPulsantiAzioni()}

      {/* Istruzioni */}
      <View style={styles.istruzioniContainer}>
        <Text style={styles.istruzioniTitle}>📋 Istruzioni:</Text>
        <Text style={styles.istruzione}>• Premi e tieni premuto "INIZIO INTERVENTO" per 3 secondi</Text>
        <Text style={styles.istruzione}>• Durante un intervento puoi terminarlo o richiedere trasferimento</Text>
        <Text style={styles.istruzione}>• Tutti i volontari saranno notificati dei cambi stato</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E30000',
    marginLeft: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 16,
  },
  squadraInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  squadraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  squadraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  squadraDettagli: {
    marginLeft: 8,
  },
  squadraNomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  squadraNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E30000',
  },
  statoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  membriLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  membroNome: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  interventoAttivoContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E30000',
  },
  interventoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  interventoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000',
    marginLeft: 8,
  },
  interventoDettagli: {
    marginLeft: 8,
  },
  interventoInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  pulsantiContainer: {
    marginBottom: 24,
  },
  pulsantePrincipale: {
    backgroundColor: '#6C757D',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  pulsanteInizio: {
    backgroundColor: '#E30000',
  },
  pulsanteTermina: {
    backgroundColor: '#28A745',
  },
  pulsanteTrasferimento: {
    backgroundColor: '#FFA500',
  },
  pulsanteDisabilitato: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  pulsantePressing: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  pulsanteText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  pulsanteSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  pulsanteSubtextPressing: {
    color: '#FFE4E1',
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFE4E1',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  pressingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pressingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  istruzioniContainer: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
  },
  istruzioniTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  istruzione: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});