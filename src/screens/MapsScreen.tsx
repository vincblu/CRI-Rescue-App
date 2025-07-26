import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Schermata Mappe - Localizzazione HP e Squadre</Text>
   
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

export default MapsScreen;