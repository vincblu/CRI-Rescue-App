// src/navigation/LoggedInTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Platform } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import InterventiScreen from '../screens/InterventiScreen';
import MapsScreen from '../screens/MapsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import TeamConfigurationScreen from '../screens/TeamConfigurationScreen';
import VolunteerSelectionScreen from '../screens/VolunteerSelectionScreen';

// Components
import CustomHeader from '../components/CustomHeader';

// Types
import { AppStackParamList } from '../types/navigation'; // Usa AppStackParamList qui

// Firebase
import { auth } from '../config/firebaseConfig'; // <-- IMPORTANTE: Assicurati che 'auth' sia importato

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AppStackParamList>(); // Usa AppStackParamList per lo stack

// Stack Navigator per Home (include EventDetail e TeamConfiguration)
function HomeStack() {
  return (
    <Stack.Navigator 
      initialRouteName="HomeMain"
      // Rimosso screenOptions={{ headerShown: false }} per poter gestire gli header singolarmente
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }} // HomeScreen userà il CustomHeader del Tab Navigator
      />
      
      {/* EventDetailScreen */}
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen} 
        options={{
          headerShown: true, // MOSTRA L'HEADER QUI
          title: 'Dettaglio Evento', // Titolo dell'header
          headerStyle: { backgroundColor: '#E30000' }, // Stile background header
          headerTintColor: 'white', // Colore freccia back e testo titolo
          headerTitleStyle: { fontWeight: 'bold' } // Stile testo titolo
        }}
      />
      
      {/* TeamConfigurationScreen */}
      <Stack.Screen 
        name="TeamConfiguration" 
        component={TeamConfigurationScreen} 
        options={{
          headerShown: true,
          title: 'Configurazione Squadre',
          headerStyle: { backgroundColor: '#E30000' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      
      {/* VolunteerSelectionScreen */}
      <Stack.Screen 
        name="VolunteerSelection" 
        component={VolunteerSelectionScreen} 
        options={{
          headerShown: true,
          title: 'Selezione Volontari',
          headerStyle: { backgroundColor: '#E30000' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
    </Stack.Navigator>
  );
}

export default function LoggedInTabs() {
  const handleLogout = () => {
    Alert.alert(
      "Conferma Logout",
      "Sei sicuro di voler uscire dall'applicazione?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Esci",
          style: "destructive",
          onPress: () => auth.signOut()
        }
      ]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Il CustomHeader è gestito solo per la tab "Home"
        header: route.name === 'Home' ? () => <CustomHeader onLogout={handleLogout} /> : undefined,
        headerShown: route.name === 'Home' ? true : false, // Mostra header solo per Home (gestito da CustomHeader)

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Interventi':
              iconName = 'medical-bag';
              break;
            case 'Maps':
              iconName = 'map';
              break;
            default:
              iconName = 'help-circle';
              break;
          }

          return (
            <MaterialCommunityIcons 
              name={iconName as any} 
              size={size} 
              color={color} 
            />
          );
        },
        tabBarActiveTintColor: '#E30000',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      {/* Per Interventi e Maps, usiamo l'header di sistema con titolo standard */}
      <Tab.Screen 
        name="Interventi" 
        component={InterventiScreen} 
        options={{ 
          headerShown: true, 
          title: 'Interventi',
          headerStyle: { backgroundColor: 'white' },
          headerTintColor: '#E30000',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="Maps" 
        component={MapsScreen} 
        options={{ 
          headerShown: true, 
          title: 'Mappa',
          headerStyle: { backgroundColor: 'white' },
          headerTintColor: '#E30000',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
    </Tab.Navigator>
  );
}