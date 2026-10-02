import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi, getApiErrorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Container } from '../../components/Container';
import { FormField } from '../../components/FormField';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../state/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ route, navigation }: Props) {
  const { signIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = route.params.mode === 'login';

  const submit = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('OTP required', 'Enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await authApi.verifyLoginOtp(route.params.email, otp.trim());
        await signIn(response);
      } else {
        await authApi.verifyEmailOtp(route.params.email, otp.trim());
        Alert.alert('Email verified', 'You can now sign in securely.');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Verification failed', getApiErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scroll contentStyle={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Verify login' : 'Verify email'}</Text>
      <Text style={styles.subtitle}>Enter the code sent to {route.params.email}.</Text>
      <View style={styles.card}>
        <FormField label="One-time code" required value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="6-digit OTP" />
        <Button title={isLogin ? 'Complete sign in' : 'Verify email'} loading={loading} onPress={submit} />
        <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
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
  }
});
