// src/components/CustomHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CustomHeaderProps {
  onLogout: () => void;
}

export default function CustomHeader({ onLogout }: CustomHeaderProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          {/* Logo e Testo */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/logo_cri.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.textSection}>
              <Text style={styles.titleText}>CRI RESCUE</Text>
              <Text style={styles.subtitleText}>Comitato Napoli Nord</Text>
            </View>
          </View>

          {/* Pulsante Logout */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={onLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={24} 
              color="#E30000" 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 5 : 12, // Padding extra per iOS
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 60, // Altezza minima garantita
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  textSection: {
    flexDirection: 'column',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E30000',
    lineHeight: 18,
  },
  subtitleText: {
    fontSize: 12,
    color: '#E30000',
    lineHeight: 14,
  },
  logoutButton: {
    padding: 12, // Padding aumentato per area touch maggiore
    borderRadius: 25,
    backgroundColor: 'rgba(227, 0, 0, 0.1)', // Sfondo leggero per evidenziarlo
    marginLeft: 10,
    minWidth: 48, // Dimensione minima per accessibilità
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});