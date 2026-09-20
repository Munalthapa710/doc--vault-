import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../constants/theme';
import type { DocumentItem } from '../types/api';
import { formatBytes, formatDate } from '../utils/format';

type DocumentCardProps = {
  item: DocumentItem;
  onFavorite?: () => void;
};

export function DocumentCard({ item, onFavorite }: DocumentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="document-lock-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.fileExtension.toUpperCase()} · {formatBytes(item.fileSize)} · {formatDate(item.uploadedAt)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        hitSlop={8}
        onPress={onFavorite}
        style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
      >
        <Ionicons name={item.isFavorite ? 'star' : 'star-outline'} size={22} color={item.isFavorite ? colors.warning : colors.subtle} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  name: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800'
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500'
  },
  favorite: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.65
  }
});
