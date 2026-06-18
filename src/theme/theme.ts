import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export interface AppTheme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    surfaceStrong: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    primary: string;
    primaryStrong: string;
    primarySoft: string;
    border: string;
    danger: string;
    dangerSoft: string;
    success: string;
    shadow: string;
    white: string;
  };
}

const lightColors = {
  background: 'whitesmoke',
  surface: 'white',
  surfaceMuted: 'honeydew',
  surfaceStrong: 'gainsboro',
  text: 'darkslategray',
  textMuted: 'dimgray',
  textSubtle: 'gray',
  primary: 'seagreen',
  primaryStrong: 'darkgreen',
  primarySoft: 'honeydew',
  border: 'lightgray',
  danger: 'firebrick',
  dangerSoft: 'mistyrose',
  success: 'seagreen',
  shadow: 'black',
  white: 'white',
};

export const lightTheme: AppTheme = { dark: false, colors: lightColors };
export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    ...lightColors,
    background: 'black',
    surface: 'darkslategray',
    surfaceMuted: 'slategray',
    surfaceStrong: 'dimgray',
    text: 'white',
    textMuted: 'lightgray',
    textSubtle: 'silver',
    primary: 'mediumseagreen',
    primaryStrong: 'darkgreen',
    primarySoft: 'seagreen',
    border: 'gray',
    danger: 'lightcoral',
    dangerSoft: 'maroon',
    success: 'springgreen',
  },
};

export function useAppTheme(): AppTheme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

export function createNavigationTheme(appTheme: AppTheme): Theme {
  const base = appTheme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: appTheme.dark,
    colors: {
      ...base.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.danger,
    },
  };
}
