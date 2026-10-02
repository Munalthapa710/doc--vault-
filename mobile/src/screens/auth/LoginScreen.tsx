import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi, getApiErrorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Container } from '../../components/Container';
import { FormField } from '../../components/FormField';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../state/AuthContext';
import type { AuthStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [method, setMethod] = useState<'otp' | 'secret'>('otp');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    if (method === 'secret' && secretWord.trim().length < 4) {
      Alert.alert('Secret word needed', 'Enter your secret word with at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      if (method === 'secret') {
        const response = await authApi.loginWithSecretWord(email.trim(), password, secretWord.trim());
        await signIn(response);
      } else {
        await authApi.requestLoginOtp(email.trim(), password);
        navigation.navigate('Otp', { email: email.trim(), mode: 'login' });
      }
    } catch (error) {
      Alert.alert('Unable to sign in', getApiErrorMessage(error, 'Please check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scroll contentStyle={styles.container}>
      <View style={styles.brandMark}>
        <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
      </View>
      <Text style={styles.kicker}>Personal Vault</Text>
      <Text style={styles.title}>Secure sign in</Text>
      <Text style={styles.subtitle}>Access encrypted documents, favorites, and storage insights from your phone.</Text>

      <View style={styles.card}>
        <View style={styles.segment}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: method === 'otp' }}
            onPress={() => setMethod('otp')}
            style={[styles.segmentButton, method === 'otp' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, method === 'otp' && styles.segmentTextActive]}>OTP</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: method === 'secret' }}
            onPress={() => setMethod('secret')}
            style={[styles.segmentButton, method === 'secret' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, method === 'secret' && styles.segmentTextActive]}>Secret word</Text>
          </Pressable>
        </View>

        <FormField label="Email" required autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <FormField
          label="Password"
          required
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          right={
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((value) => !value)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
            </Pressable>
          }
        />
        {method === 'secret' ? (
          <FormField label="Secret word" required secureTextEntry value={secretWord} onChangeText={setSecretWord} placeholder="Private recovery word" />
        ) : null}
        <Button title={method === 'secret' ? 'Sign in' : 'Send OTP'} loading={loading} onPress={submit} />
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
        <Text style={styles.linkText}>Create a new vault account</Text>
      </Pressable>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center'
  },
  brandMark: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  title: {
    marginTop: spacing.xs,
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
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  segmentActive: {
    backgroundColor: colors.surface
  },
  segmentText: {
    color: colors.muted,
    fontWeight: '800'
  },
  segmentTextActive: {
    color: colors.primary
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
  }
});
