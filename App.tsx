// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import LoggedInTabs from './src/navigation/LoggedInTabs';
import EventDetailScreen from './src/screens/EventDetailScreen';
import TeamConfigurationScreen from './src/screens/TeamConfigurationScreen';
import VolunteerSelectionScreen from './src/screens/VolunteerSelectionScreen';

// Types
import { AppStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Main App Navigator Component
const AppNavigator: React.FC = () => {
  const { user, currentUser, loading } = useAuth();

  // Loading screen durante verifica autenticazione
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E30000" />
        <Text style={styles.loadingText}>Caricamento...</Text>
        <Text style={styles.loadingSubText}>Verifica credenziali</Text>
      </View>
    );
  }

  // Debug info (rimuovere in produzione)
  console.log('🎯 App render:', {
    hasFirebaseUser: !!user,
    hasCurrentUser: !!currentUser,
    userEmail: user?.email,
    userRole: currentUser?.role,
    isAdmin: currentUser?.isAdmin
  });

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      
      {!user || !currentUser ? (
        // Non autenticato - mostra login
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        // Autenticato - mostra app principale
        <Stack.Navigator 
          initialRouteName="HomeMain"
          screenOptions={{ headerShown: false }}
        >
          {/* Tab principale con Home/Interventi/Maps */}
          <Stack.Screen 
            name="HomeMain" 
            component={LoggedInTabs}
          />
          
          {/* Schermate di dettaglio */}
          <Stack.Screen 
            name="EventDetail" 
            component={EventDetailScreen}
            options={{
              headerShown: true,
              title: 'Dettaglio Evento',
              headerStyle: { backgroundColor: '#E30000' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: 'bold' }
            }}
          />
          
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
      )}
    </NavigationContainer>
  );
};

// Root App Component con AuthProvider
const App: React.FC = () => {
  console.log('🚀 App inizializzazione...');
  
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30000'
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666'
  }
});

export default App;