const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const path = require('path');

const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

const { MakeJsArtWebpackPlugin } = require('makejs.art');

const mode = 'development';

const clientConfig = {
    context: ROOT,

    mode,
    entry: {
        demo: './demo.tsx',
        index: './index.tsx',
    },

    output: {
        filename: '[name].bundle.js',
        path: DESTINATION,
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        modules: [ROOT, 'node_modules'],
    },

    module: {
        rules: [
            /****************
             * PRE-LOADERS
             *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader',
            },
            {
                enforce: 'pre',
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'tslint-loader',
            },

            /****************
             * LOADERS
             *****************/
            {
                test: /\.tsx?$/,
                exclude: [/node_modules/],
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },

    plugins: [
        // Leave this uncommented to see a diagram of bundle space usage
        // it will open in the browser after build completes
        // new BundleAnalyzerPlugin(),
    ],

    devtool: 'cheap-module-source-map',
    devServer: {},
};

if (process.env.BUILD_MODE === 'dist') {
    clientConfig.plugins.push(
        new MakeJsArtWebpackPlugin({
            imagePath: './static/minilogo.jpg',
            cutoff: 0.6,
            invert: true,
        })
    );
}

module.exports = [clientConfig];
