module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { node: 'current' }, // ensures compatibility with your current Node version
            },
        ],
    ],
};