'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';

const MaterialUIProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#64748b',
            light: '#94a3b8',
            dark: '#475569',
            contrastText: '#ffffff',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#64748b',
          },
          success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
          },
          error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
          },
          warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
          },
          info: {
            main: '#06b6d4',
            light: '#22d3ee',
            dark: '#0891b2',
          },
        },
        typography: {
          fontFamily: 'var(--font-geist-sans)',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: '1px solid #e2e8f0',
              },
              head: {
                fontWeight: 600,
                backgroundColor: '#f8fafc',
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
              },
            },
          },
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default MaterialUIProvider;