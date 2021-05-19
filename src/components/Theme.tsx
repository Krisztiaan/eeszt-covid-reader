import React from 'react';

import { View as MotiView, Text as MotiText } from 'moti';
import {
  createBox,
  createText,
  createTheme,
  ThemeProvider as ReStyleThemeProvider,
  useTheme as useReTheme,
} from '@shopify/restyle';
import { View } from 'react-native';

export const theme = createTheme({
  colors: {
    bgPrimary: '#000',
    textValid: '#2f29',
    textInvalid: '#f229',
    textLabel: '#aaa',
    textPrimary: '#fff',
    transparent: '#0000',
  },
  spacing: {
    xs: 6,
    s: 12,
    m: 18,
    l: 30,
    xl: 48,
  },
  borderRadii: {
    m: 12,
  },
  breakpoints: {},
  textVariants: {
    defaults: {
      color: 'textPrimary',
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontSize: 16,
    },
    hint: {
      fontWeight: '500',
    },
    highlight: { fontWeight: '900', fontSize: 24 },
    label: {
      color: 'textLabel',
    },
    value: {
      color: 'textPrimary',
      fontWeight: '700',
    },
  },
} as const);

export const ThemeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <ReStyleThemeProvider theme={theme}>{children}</ReStyleThemeProvider>
);
export type Theme = typeof theme;
export const Box = createBox<Theme, React.ComponentProps<typeof MotiView>>(MotiView);
export const Text = createText<Theme, React.ComponentProps<typeof MotiText>>(MotiText);
export const useTheme: () => Theme = useReTheme;
export const Space = ({ s }: { s: number | keyof Theme['spacing'] }): JSX.Element => {
  const appTheme = useTheme();
  const size = typeof s === 'string' ? appTheme.spacing[s] : s;
  return <View style={{ height: size, width: size }} />;
};
