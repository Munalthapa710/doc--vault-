import { Platform } from 'react-native';

export const colors = {
  canvas: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF6F4',
  ink: '#102032',
  muted: '#5F7187',
  subtle: '#8EA0B7',
  border: '#D8E2EA',
  primary: '#126A78',
  primaryPressed: '#0D5662',
  primarySoft: '#DCF3F2',
  secondary: '#4F46E5',
  warning: '#A15C00',
  warningSoft: '#FFF2D8',
  success: '#197B50',
  successSoft: '#E2F7EA',
  danger: '#C83232',
  dangerSoft: '#FFE8E8',
  shadow: '#102032',
  white: '#FFFFFF'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

export const fonts = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif-condensed', default: 'System' })
};

export const shadow = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 4
};
