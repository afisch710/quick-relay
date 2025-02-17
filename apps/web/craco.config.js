// web/craco.config.js

const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.module.rules.push({
                test: /\.worker\.js$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        filename: 'static/js/[name].worker.js',
                        // Enable ES Modules if necessary
                        esModule: true,
                    },
                },
            });

            // Maintain detailed stats for debugging
            webpackConfig.stats = {
                children: true,
                errors: true,
                errorDetails: true,
                warnings: true
            };

            // Optional: Add aliases for cleaner imports
            webpackConfig.resolve.alias = {
                ...webpackConfig.resolve.alias,
                '@workers': path.resolve(__dirname, 'src/workers/'),
            };

            return webpackConfig;
        }
    }
};