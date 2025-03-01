import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalStyles, useMediaQuery } from '@mui/material';
import { useDevice } from '../context/DeviceProvider';
import palette from './palette';
import ThemeName from './ThemeName';
import { useStorage } from '../context/StorageProvider';
import { StorageKey } from '../utility/StorageKey';
import { Feature } from '../utility/Feature';

// Create a context to expose theme updater functions.
const ThemeUpdateContext = createContext({
  setThemeName: () => { },
  updateBackgroundColors: () => { },
});

// Hook for consuming the updater context.
export const useThemeUpdate = () => useContext(ThemeUpdateContext);

const DynamicTheme = ({ children }) => {
  const { getItem, setItem } = useStorage();
  const { isMobile } = useDevice();

  const themeKey = useMemo(() => { return new StorageKey(Feature.settings, 'theme') }, []);

  // Load initial theme from storage
  const [themeName, setThemeName] = useState(getItem(themeKey) ?? ThemeName.system);

  useEffect(() => {
    // Persist new theme in storage
    setItem(themeKey, themeName);
  }, [themeName, themeKey, setItem]);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const getBasePalette = useCallback((name) => {
    if (name === ThemeName.system) {
      return prefersDarkMode ? palette.dark : palette.light;
    }
    return name === ThemeName.light ? palette.light : palette.dark;
  }, [prefersDarkMode]);

  // Compose theme options, merging the base palette with dynamic updates.
  const themeOptions = useMemo(
    () => ({
      name: themeName,
      palette: {
        ...getBasePalette(themeName),
        background: {
          ...getBasePalette(themeName).background,
        },
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
    [themeName, isMobile, getBasePalette]
  );

  // Create the theme only when themeOptions change.
  const dynamicTheme = useMemo(() => createTheme(themeOptions), [themeOptions]);

  return (
    <ThemeUpdateContext.Provider value={{ setThemeName }}>
      <ThemeProvider theme={dynamicTheme}>
        <GlobalStyles
          styles={{
            html: {
              backgroundColor: dynamicTheme.palette.background.primary,
              color: dynamicTheme.palette.text.primary,
              margin: 0,
              padding: 0,
            },
            body: {
              margin: 0,
            }
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

export default React.memo(DynamicTheme);