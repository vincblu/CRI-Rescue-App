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
import { RootStackParamList } from '../types/navigation';

// Firebase
import { auth } from '../config/firebaseConfig';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack Navigator per Home (include EventDetail e TeamConfiguration)
function HomeStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="HomeMain"
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="TeamConfiguration" component={TeamConfigurationScreen} />
      <Stack.Screen name="VolunteerSelection" component={VolunteerSelectionScreen} />
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
        header: () => <CustomHeader onLogout={handleLogout} />,
        headerShown: true, // Assicurati che sia visibile
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
          paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Spazio extra per iPhone
          height: Platform.OS === 'ios' ? 85 : 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Interventi" component={InterventiScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
    </Tab.Navigator>
  );
}