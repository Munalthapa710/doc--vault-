import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../constants/theme';

type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'success' | 'warning' | 'secondary';
};

export function StatCard({ label, value, icon, tone = 'primary' }: StatCardProps) {
  const toneColor = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'secondary' ? colors.secondary : colors.primary;
  const toneSoft = tone === 'success' ? colors.successSoft : tone === 'warning' ? colors.warningSoft : colors.primarySoft;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: toneSoft }]}>
        <Ionicons name={icon} size={22} color={toneColor} />
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 136,
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  value: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  }
});
