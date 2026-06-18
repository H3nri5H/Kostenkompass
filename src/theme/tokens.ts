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
    onPrimary: string;
    border: string;
    danger: string;
    dangerSoft: string;
    success: string;
    warning: string;
    info: string;
    shadow: string;
    white: string;
  };
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#FFF8F2',
    surface: '#FFFFFF',
    surfaceMuted: '#F7ECE4',
    surfaceStrong: '#E7D6CB',
    text: '#241B17',
    textMuted: '#6F5E55',
    textSubtle: '#9B877C',
    primary: '#F2762E',
    primaryStrong: '#D95F1F',
    primarySoft: '#FFE1CC',
    onPrimary: '#241B17',
    border: '#E7D6CB',
    danger: '#B94242',
    dangerSoft: '#FBE5E2',
    success: '#2D7B62',
    warning: '#9A5A00',
    info: '#356B9B',
    shadow: '#241B17',
    white: '#FFFFFF',
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#151210',
    surface: '#201A17',
    surfaceMuted: '#2B221E',
    surfaceStrong: '#493A33',
    text: '#FFF4EB',
    textMuted: '#C9B7AC',
    textSubtle: '#947F73',
    primary: '#FF8A3D',
    primaryStrong: '#F2762E',
    primarySoft: '#4B2A19',
    onPrimary: '#151210',
    border: '#493A33',
    danger: '#FF7A74',
    dangerSoft: '#4A2422',
    success: '#65C79B',
    warning: '#F0B24C',
    info: '#7EAFE3',
    shadow: '#000000',
    white: '#FFFFFF',
  },
};
