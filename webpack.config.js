const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const path = require('path');

const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

const { MakeJsArtWebpackPlugin } = require('makejs.art');

const clientConfig = {
    context: ROOT,

    mode: process.env.BUILD_MODE || 'development',
    entry: {
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
        ],
    },

    plugins: [
        new MakeJsArtWebpackPlugin({
            imagePath: './static/logo.png',
            cutoff: 0.32,
        }),
        // Leave this uncommented to see a diagram of bundle space usage
        // it will open in the browser after build completes
        // new BundleAnalyzerPlugin(),
    ],

    devtool: 'cheap-module-source-map',
    devServer: {},
};

module.exports = [clientConfig];
