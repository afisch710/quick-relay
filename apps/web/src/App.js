// src/App.js
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import Join from './pages/Join';
import ActiveSession from './pages/ActiveSession';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // sleek blue
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5', // light background
    },
    text: {
      primary: '#424242',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<Join />} />
          <Route path="/session" element={<ActiveSession />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;