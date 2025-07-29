// src/components/KeyboardAwareWrapper.tsx
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface KeyboardAwareWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardVerticalOffset?: number;
  behavior?: 'height' | 'position' | 'padding';
}

const KeyboardAwareWrapper: React.FC<KeyboardAwareWrapperProps> = ({
  children,
  style,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false,
  keyboardVerticalOffset,
  behavior,
}) => {
  // Configurazione automatica per iOS/Android
  const defaultBehavior = behavior || (Platform.OS === 'ios' ? 'padding' : 'height');
  const defaultOffset = keyboardVerticalOffset ?? (Platform.OS === 'ios' ? 0 : 20);

  if (!scrollEnabled) {
    // Solo KeyboardAvoidingView per schermate senza scroll
    return (
      <KeyboardAvoidingView
        style={[styles.container, style]}
        behavior={defaultBehavior}
        keyboardVerticalOffset={defaultOffset}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  // KeyboardAvoidingView + ScrollView per schermate con contenuto scrollable
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={defaultBehavior}
      keyboardVerticalOffset={defaultOffset}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardAwareWrapper;