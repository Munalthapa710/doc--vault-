import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { dashboardApi } from '../../api/client';
import { AppHeader } from '../../components/AppHeader';
import { Container } from '../../components/Container';
import { DocumentCard } from '../../components/DocumentCard';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { colors, spacing } from '../../constants/theme';
import type { DashboardSummary } from '../../types/api';
import { formatBytes, formatDate } from '../../utils/format';

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await dashboardApi.summary();
    setSummary(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    try {
      await load();
    } catch {
      // Keep the current dashboard visible if refresh fails.
    }
  };

  if (loading) {
    return (
      <Container>
        <ActivityIndicator color={colors.primary} />
      </Container>
    );
  }

  return (
    <Container
      scroll
      contentStyle={styles.content}
      style={styles.container}
    >
      <AppHeader title="Vault" subtitle={`Last login: ${formatDate(summary?.lastLoginAt)}`} rightIcon="refresh-outline" onRightPress={refresh} />
      <View style={styles.grid}>
        <StatCard label="Documents" value={String(summary?.totalDocuments ?? 0)} icon="documents-outline" />
        <StatCard label="Storage" value={formatBytes(summary?.totalStorageUsed ?? 0)} icon="server-outline" tone="secondary" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Favorites" value={String(summary?.favoriteDocuments.length ?? 0)} icon="star-outline" tone="warning" />
        <StatCard label="File types" value={String(Object.keys(summary?.documentsByType ?? {}).length)} icon="layers-outline" tone="success" />
      </View>

      <Text style={styles.sectionTitle}>Recent uploads</Text>
      <View style={styles.list}>
        {summary?.recentUploads.length ? (
          summary.recentUploads.map((item) => <DocumentCard key={item.id} item={item} />)
        ) : (
          <EmptyState title="No documents yet" message="Upload your first encrypted document to start building your vault." />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas
  },
  content: {
    gap: spacing.lg
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  sectionTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900'
  },
  list: {
    gap: spacing.md
  }
});
