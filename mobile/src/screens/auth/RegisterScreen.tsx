import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi, getApiErrorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Container } from '../../components/Container';
import { FormField } from '../../components/FormField';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Check your details', 'Name and email are required.');
      return;
    }

    if (!strongPassword.test(password)) {
      Alert.alert('Check your password', 'Use 8+ characters with lowercase, uppercase, number, and symbol.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ fullName: fullName.trim(), email: email.trim(), password });
      navigation.navigate('Otp', { email: email.trim(), mode: 'verifyEmail' });
    } catch (error) {
      Alert.alert('Registration failed', getApiErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scroll contentStyle={styles.container}>
      <Text style={styles.title}>Create your vault</Text>
      <Text style={styles.subtitle}>Start with a verified account before storing private documents.</Text>
      <View style={styles.card}>
        <FormField label="Full name" required value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <FormField label="Email" required autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <FormField label="Password" required secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
        <Text style={styles.passwordHint}>Use lowercase, uppercase, a number, and a symbol.</Text>
        <Button title="Create account" loading={loading} onPress={submit} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.linkButton}>
        <Text style={styles.linkText}>Back to sign in</Text>
      </Pressable>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center'
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24
  },
  card: {
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow
  },
  linkButton: {
    minHeight: 48,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  passwordHint: {
    marginTop: -spacing.sm,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700'
  }
});
