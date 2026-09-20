import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsApi } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Container } from '../../components/Container';
import { FormField } from '../../components/FormField';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../state/AuthContext';

export default function SettingsScreen() {
  const { user, signOut, refreshMe } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [secretWord, setSecretWord] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Enter your full name.');
      return;
    }

    setSavingProfile(true);
    try {
      await settingsApi.updateProfile({ fullName: fullName.trim(), emailOtpLoginEnabled: user?.emailOtpLoginEnabled });
      await refreshMe();
      Alert.alert('Profile saved', 'Your vault profile was updated.');
    } catch {
      Alert.alert('Unable to save', 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSecretWord = async () => {
    if (secretWord.trim().length < 4) {
      Alert.alert('Secret word too short', 'Use at least 4 characters.');
      return;
    }

    setSavingSecret(true);
    try {
      await settingsApi.updateSecretWord(secretWord.trim());
      setSecretWord('');
      await refreshMe();
      Alert.alert('Secret word saved', 'You can use it for secure mobile sign in.');
    } catch {
      Alert.alert('Unable to save secret word', 'Please try again.');
    } finally {
      setSavingSecret(false);
    }
  };

  return (
    <Container scroll contentStyle={styles.content}>
      <AppHeader title="Settings" subtitle={user?.email ?? 'Vault account'} />
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={26} color={colors.primary} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <FormField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <Button title="Save profile" loading={savingProfile} onPress={saveProfile} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Secret word</Text>
        <Text style={styles.help}>Set a secret word to sign in quickly without email OTP on mobile.</Text>
        <FormField label="New secret word" value={secretWord} onChangeText={setSecretWord} secureTextEntry placeholder="At least 4 characters" />
        <Button title="Update secret word" loading={savingSecret} onPress={saveSecretWord} />
      </View>

      <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={21} color={colors.danger} />
        <Text style={styles.signOutText}>Sign out from all devices</Text>
      </Pressable>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  identityCopy: {
    flex: 1,
    minWidth: 0
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  email: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  help: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  signOut: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft
  },
  signOutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900'
  }
});
