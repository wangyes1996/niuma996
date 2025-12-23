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
            main: '#6366f1',
            light: '#8b5cf6',
            dark: '#4f46e5',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#06b6d4',
            light: '#22d3ee',
            dark: '#0891b2',
            contrastText: '#ffffff',
          },
          background: {
            default: '#fafafa',
            paper: '#ffffff',
          },
          text: {
            primary: '#111827',
            secondary: '#6b7280',
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
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
          },
          grey: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
        },
        typography: {
          fontFamily: 'var(--font-geist-sans)',
          h1: {
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.125,
            letterSpacing: '-0.02em',
          },
          h2: {
            fontSize: '2.25rem',
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          },
          h3: {
            fontSize: '1.875rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
          },
          h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.45,
            letterSpacing: '-0.01em',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          },
          subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
          },
          subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.5,
          },
          button: {
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
          },
          caption: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            letterSpacing: '0.025em',
          },
          overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          },
        },
        shape: {
          borderRadius: 12,
        },
        spacing: 8,
        breakpoints: {
          values: {
            xs: 0,
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  transform: 'translateY(-2px)',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 12,
                fontWeight: 600,
                padding: '10px 20px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
              },
              contained: {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                },
              },
              outlined: {
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: '1px solid #e5e7eb',
                padding: '16px',
              },
              head: {
                fontWeight: 600,
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                fontWeight: 500,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.75rem',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
              },
            },
          },
          MuiContainer: {
            styleOverrides: {
              root: {
                paddingLeft: '16px',
                paddingRight: '16px',
                '@media (min-width: 640px)': {
                  paddingLeft: '24px',
                  paddingRight: '24px',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9ca3af',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                height: 8,
              },
            },
          },
          MuiCircularProgress: {
            styleOverrides: {
              root: {
                color: '#6366f1',
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