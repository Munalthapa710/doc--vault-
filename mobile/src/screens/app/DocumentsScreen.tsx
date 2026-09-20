import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { documentApi } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { Container } from '../../components/Container';
import { DocumentCard } from '../../components/DocumentCard';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { colors, spacing } from '../../constants/theme';
import type { DocumentItem } from '../../types/api';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const response = await documentApi.list({ page: 1, pageSize: 30, search });
    setDocuments(response.rows);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load().finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const updated = await documentApi.favorite(id);
      setDocuments((items) => items.map((item) => (item.id === id ? updated : item)));
    } catch {
      Alert.alert('Favorite failed', 'Could not update this document.');
    }
  };

  return (
    <Container padded={false}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <AppHeader title="Documents" subtitle={`${documents.length} secure files`} rightIcon="refresh-outline" onRightPress={refresh} />
            <FormField label="Search" value={search} onChangeText={setSearch} placeholder="Search by name, type, or tag" />
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <EmptyState title="Nothing found" message="Try another search or upload a new document." />
          )
        }
        renderItem={({ item }) => <DocumentCard item={item} onFavorite={() => toggleFavorite(item.id)} />}
        ItemSeparatorComponent={() => null}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  }
});
