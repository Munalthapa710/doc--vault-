import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
};

export function AppHeader({ title, subtitle, rightIcon, onRightPress }: AppHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightIcon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title === 'Documents' ? 'Refresh documents' : 'Header action'}
          hitSlop={8}
          onPress={onRightPress}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name={rightIcon} size={22} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500'
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  pressed: {
    opacity: 0.72
  }
});
