import { createTheme } from '@mui/material/styles';

// Colours
export const brand = {
  navy: '#0F3B78',
  blue: '#1E6FE8',
  bg: '#EAF3FE',
  text: '#0B2A5B',
  muted: '#64748B',
  line: '#D6E2F3',
  ink: '#0F172A',
  cardBorder: '#E3EAF5',
  cardShadow: '0 4px 16px rgba(15, 59, 120, 0.08)',
};

export const layout = {
  sidebarWidth: 240,
  topbarHeight: 64,
};

// KPI card tints
export const tints = {
  blue: '#EBF2FF',
  green: '#E8F9F1',
  orange: '#FFF7E6',
  red: '#FFEBEB',
};

// Job status badge
export const statusColors = {
  received:        { bg: '#E8F2FF', fg: '#1E6FE8' },
  diagnosing:      { bg: '#FFF7E6', fg: '#F59E0B' },
  waiting_approval:{ bg: '#FEF3C7', fg: '#B45309' },
  waiting_parts:   { bg: '#FFEDD5', fg: '#C2410C' },
  in_repair:       { bg: '#E0F2FE', fg: '#0284C7' },
  quality_check:   { bg: '#EDE9FE', fg: '#7C3AED' },
  ready:           { bg: '#D1FAE5', fg: '#059669' },
  delivered:       { bg: '#E0E7FF', fg: '#3730A3' },
  not_repairable:  { bg: '#FFE4E6', fg: '#E11D48' },
  cancelled:       { bg: '#F3F4F6', fg: '#64748B' },
};

const theme = createTheme({
  palette: {
    primary: { main: brand.blue },
    secondary: { main: brand.navy },
    background: { default: brand.bg },
    text: { primary: brand.text, secondary: brand.muted },
    divider: brand.line,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    h1: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Poppins", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Poppins", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 48, boxShadow: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', borderRadius: 10 },
        notchedOutline: { borderColor: brand.line },
      },
    },
  },
});

export default theme;