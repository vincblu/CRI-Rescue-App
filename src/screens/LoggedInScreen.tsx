// src/screens/LoggedInScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoggedInScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Benvenuto, utente loggato!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LoggedInScreen;