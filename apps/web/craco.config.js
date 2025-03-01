module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.module.rules.push({
                test: /\.mjs$/,
                include: /node_modules\/pdfjs-dist/,
                type: "javascript/auto",
            });
            return webpackConfig;
        },
    },
};