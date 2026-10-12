import { createTheme } from '@mui/material/styles';

// Colours estimated from the login mockup. Change here and the whole app updates.
export const brand = {
  navy: '#0F3B78',
  blue: '#1E6FE8',
  bg: '#EAF3FE',
  text: '#0B2A5B',
  muted: '#5B6B86',
  line: '#D6E2F3',
};

const theme = createTheme({
  palette: {
    primary: { main: brand.blue },
    secondary: { main: brand.navy },
    background: { default: brand.bg },
    text: { primary: brand.text, secondary: brand.muted },
    divider: brand.line,
  },
  shape: { borderRadius: 10 },
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