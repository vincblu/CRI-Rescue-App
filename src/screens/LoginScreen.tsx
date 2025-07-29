// src/screens/LoginScreen.tsx - VERSIONE DEFINITIVA ANTI-OVERLAP
import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  Platform 
} from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebaseConfig';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper'; // IMPORTA IL WRAPPER

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
    <KeyboardAwareWrapper 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
      <View style={styles.contentContainer}>
        
        {/* Header con Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/logo_cri.jpg')}
            style={styles.logo}
          />
          <Text style={styles.appTitle}>CRI Rescue App</Text>
          <Text style={styles.subtitle}>Croce Rossa Italiana</Text>
          <Text style={styles.subtitle}>Comitato Napoli Nord</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Accedi</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer per garantire spazio sotto */}
        <View style={styles.bottomSpacer} />
      </View>
    </KeyboardAwareWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingTop: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E30000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
    paddingHorizontal: 10,
  },
  input: {
    height: 55,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333333',
  },
  button: {
    backgroundColor: '#E30000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#E30000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100, // Spazio extra importante
  },
});

export default LoginScreen;