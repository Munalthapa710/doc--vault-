import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  required?: boolean;
  right?: React.ReactNode;
};

export function FormField({ label, error, required, right, style, multiline, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.inputWrap, multiline && styles.multiLine, error && styles.inputError]}>
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor={colors.subtle}
          style={[styles.input, multiline ? styles.multiLineInput : null, right ? styles.inputWithRight : null, style]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  required: {
    color: colors.danger
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center'
  },
  multiLine: {
    minHeight: 112
  },
  inputError: {
    borderColor: colors.danger
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '500'
  },
  inputWithRight: {
    paddingRight: 52
  },
  multiLineInput: {
    paddingTop: spacing.md
  },
  right: {
    position: 'absolute',
    right: spacing.md,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700'
  }
});
