import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalStyles, useMediaQuery } from '@mui/material';
import { useDevice } from '../context/DeviceProvider';
import palette from './palette';
import ThemeName from './ThemeName';

const getBasePalette = (name) =>
  name === ThemeName.light ? palette.light : palette.dark;

// Create a context to expose theme updater functions.
const ThemeUpdateContext = createContext({
  setThemeName: () => { },
  updateBackgroundColors: () => { },
});

// Hook for consuming the updater context.
export const useThemeUpdate = () => useContext(ThemeUpdateContext);

const DynamicTheme = ({ children, initialTheme }) => {
  const { isMobile } = useDevice();

  // Use useMediaQuery to check the system's color scheme.
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // If no initialTheme is provided, use the system preference.
  const [themeName, setThemeName] = useState(
    initialTheme || (prefersDarkMode ? ThemeName.dark : ThemeName.light)
  );

  // Use customPalette to store dynamic updates to palette background colors.
  const [customPalette, setCustomPalette] = useState({});

  // Allow external code to update the background colors.
  const updateBackgroundColors = useCallback((newBackgroundColors) => {
    setCustomPalette((prev) => ({
      ...prev,
      background:
        newBackgroundColors == null ||
          newBackgroundColors[themeName] == null ||
          !newBackgroundColors[themeName].primary
          ? getBasePalette(themeName).background
          : newBackgroundColors[themeName],
    }));
  }, [themeName]);

  // Compose theme options, merging the base palette with dynamic updates.
  const themeOptions = useMemo(
    () => ({
      name: themeName,
      palette: {
        ...getBasePalette(themeName),
        background: {
          ...getBasePalette(themeName).background,
          ...(customPalette.background || {}),
        },
      },
      transitions: {
        background: 'background-color 2000ms ease-in-out',
      },
      icon: {
        opacity: '50%',
      },
      typography: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: isMobile ? 10 : 14,
      },
      breakpoints: {
        values: {
          maxContentWidth: isMobile ? 768 : 1200,
          contentWidthPercentage: isMobile ? '95%' : '70%',
        },
      },
      components: {
        MuiContainer: {
          styleOverrides: {
            root: {
              maxWidth: isMobile ? 768 : 1200,
            },
          },
        },
        MuiLink: {
          styleOverrides: {
            root: {
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: isMobile ? 10 : 14,
            },
          },
        },
      },
    }),
    [themeName, isMobile, customPalette]
  );

  // Create the theme only when themeOptions change.
  const dynamicTheme = useMemo(() => createTheme(themeOptions), [themeOptions]);

  return (
    <ThemeUpdateContext.Provider value={{ setThemeName, updateBackgroundColors }}>
      <ThemeProvider theme={dynamicTheme}>
        <GlobalStyles
          styles={{
            html: {
              backgroundColor: dynamicTheme.palette.background.primary,
              color: dynamicTheme.palette.text.primary,
              margin: 0,
              padding: 0,
              transition: dynamicTheme.transitions.background,
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ThemeUpdateContext.Provider>
  );
};

DynamicTheme.propTypes = {
  children: PropTypes.node.isRequired,
  initialTheme: PropTypes.string,
};

DynamicTheme.defaultProps = {
  initialTheme: null,
};

export default DynamicTheme;