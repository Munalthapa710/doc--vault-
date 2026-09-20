import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { documentApi } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Container } from '../../components/Container';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { formatBytes } from '../../utils/format';

type PickedDocument = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
};

export default function UploadScreen() {
  const [file, setFile] = useState<PickedDocument | null>(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true
    });

    if (!result.canceled && result.assets[0]) {
      setFile(result.assets[0]);
    }
  };

  const upload = async () => {
    if (!file) {
      Alert.alert('Choose a file', 'Pick a document before uploading.');
      return;
    }

    setLoading(true);
    try {
      await documentApi.upload(file);
      Alert.alert('Uploaded', 'Your document was encrypted and saved.');
      setFile(null);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container scroll contentStyle={styles.content}>
      <AppHeader title="Upload" subtitle="Encrypt and store a document" />
      <View style={styles.dropZone}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-upload-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.title}>{file ? file.name : 'Choose a document'}</Text>
        <Text style={styles.subtitle}>
          {file ? `${file.mimeType || 'Unknown type'} · ${formatBytes(file.size ?? 0)}` : 'Pick a file from your phone. The backend validates type and size before saving.'}
        </Text>
        <Button title={file ? 'Choose another file' : 'Pick file'} variant="secondary" onPress={pickFile} />
        <Button title="Upload securely" loading={loading} disabled={!file} onPress={upload} />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  dropZone: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  title: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center'
  }
});
