const light = ({
    background: {
        primary: '#fff',
        secondary: '#F2F2F2',
        tertiary: '#F0F0F0',
        accent: '#ebf6fc',
    },
    primary: {
        main: '#fff',
    },
    secondary: {
        main: '#777',
    },
    text: {
        primary: '#111',
        secondary: '#555',
        accent: '#029ef2',
    },
});

const dark = ({
    background: {
        primary: '#262626',
        secondary: '#0D0D0D',
        tertiary: '#262626',
        accent: '#21affc',
    },
    primary: {
        main: '#555',
    },
    secondary: {
        main: '#fff',
    },
    text: {
        primary: '#fff',
        secondary: '#555',
        accent: '#4abaf7',

    },
});

const palette = Object.freeze({
    light: light,
    dark: dark,
});

export default palette;