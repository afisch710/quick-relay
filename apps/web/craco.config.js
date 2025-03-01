const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Add rule for pdfjs-dist .mjs files
            webpackConfig.module.rules.push({
                test: /\.mjs$/,
                include: /node_modules\/pdfjs-dist/,
                type: "javascript/auto",
            });
            // Add ESLint plugin that fails on warnings/errors
            webpackConfig.plugins.push(
                new ESLintPlugin({
                    failOnWarning: true,
                    failOnError: true,
                })
            );
            return webpackConfig;
        },
    },
};