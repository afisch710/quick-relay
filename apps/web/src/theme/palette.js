const light = ({
    background: {
        primary: '#FFF',
        secondary: '#F2F2F2',
        tertiary: '#FFF',
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
        secondary: '#888',
        accent: '#029ef2',
    },
});

const dark = ({
    background: {
        primary: '#212121',
        secondary: '#171717',
        tertiary: '#303030',
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