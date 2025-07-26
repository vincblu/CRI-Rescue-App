import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebaseConfig';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const auth = getAuth(app);

  const handleLogin = async () => {
    try {
      console.log('Tentativo di login con:', email, password);
      console.log('Prima della chiamata a signInWithEmailAndPassword');

      // Promise.race per implementare un timeout sulla richiesta di login
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      const timeoutPromise = new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error('Login request timed out')), 15000) // 15 secondi di timeout
      );

      await Promise.race([loginPromise, timeoutPromise]);

      console.log('Dopo la chiamata a signInWithEmailAndPassword (Login riuscito!)');
      // Non c'è bisogno di navigare qui, App.tsx gestirà lo stato dell'utente
    } catch (error: any) {
      if (error.message === 'Login request timed out') {
        Alert.alert('Errore di Connessione', 'La richiesta di login è scaduta. Controlla la tua connessione internet.');
        console.error('Timeout login:', error.message);
      } else {
        let errorMessage = 'Si è verificato un errore durante il login.';
        if (error.code === 'auth/invalid-email') {
          errorMessage = 'L\'indirizzo email non è valido.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'Questo account è stato disabilitato.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'Credenziali non valide. Controlla email e password.';
        }
        Alert.alert('Errore di Login', errorMessage);
        console.error('Errore durante il login:', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Logo CRI */}
        <Image
          source={require('../../assets/logo_cri.jpg')} // Assicurati che il percorso sia corretto
          style={styles.logo}
        />
        {/* Testo dell'App */}
        <Text style={styles.appTitle}>CRI Rescue App</Text>
        {/* Testo Secondario */}
        <Text style={styles.subtitle}>Croce Rossa Italiana</Text>
        <Text style={styles.subtitle}>Comitato Napoli Nord</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Campo Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {/* Campo Password */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Pulsante Login */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Accedi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Sfondo bianco
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150, // Larghezza desiderata del logo
    height: 150, // Altezza desiderata del logo (proporzionata)
    resizeMode: 'contain', // Assicura che l'immagine si adatti senza tagliare
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E30000', // Rosso CRI
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300, // Larghezza massima per i campi input
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E30000', // Rosso CRI
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;