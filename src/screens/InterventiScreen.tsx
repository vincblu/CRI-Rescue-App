import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InterventiScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Schermata Interventi</Text>
      {/* Qui andranno i pulsanti per Inizio Intervento, Termina Intervento, Trasferimento in HP [cite: 14, 16, 17] */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default InterventiScreen;