const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const path = require('path');
const pkg = require('./package.json');

const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

const { MakeJsArtWebpackPlugin } = require('makejs.art');

const mode = 'development';

const sharedConfig = {
    context: ROOT,

    mode,
    plugins: [],

    output: {
        path: DESTINATION,
        filename: '[name].js',
        library: pkg.name,
        libraryTarget: 'umd',
        publicPath: '/dist/',
        umdNamedDefine: true,
    },

    module: {
        rules: [
            /****************
             * PRE-LOADERS
             *****************/
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
                test: /\.svg$/,
                use: [
                    {
                        loader: '@svgr/webpack',
                        options: {
                            ref: true,
                            svgo: false,
                        },
                    },
                ],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(ttf|png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                    },
                ],
            },
        ],
    },

    // devtool: 'cheap-module-source-map',
    devServer: {},
};

const libraryConfig = {
    ...sharedConfig,
    entry: {
        index: 'index.tsx',
    },

    resolve: {
        extensions: ['.ts', '.js', '.tsx'],
        modules: [ROOT, 'node_modules'],
        alias: {
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        },
    },

    externals: {
        // Don't bundle react or react-dom as a library
        react: {
            commonjs: 'react',
            commonjs2: 'react',
            amd: 'React',
            root: 'React',
        },
        'react-dom': {
            commonjs: 'react-dom',
            commonjs2: 'react-dom',
            amd: 'ReactDOM',
            root: 'ReactDOM',
        },
    },
};

const demoConfig = {
    ...sharedConfig,
    entry: {
        demo: 'demo.tsx',
    },
    plugins: [],

    resolve: {
        extensions: ['.ts', '.js', '.tsx'],
        modules: [ROOT, 'node_modules'],
    },
};

// Script config is like library config but we export a global variable GpxReplay
const scriptConfig = {
    ...libraryConfig,
    output: {
        ...libraryConfig.output,
        filename: 'script.js',
        libraryTarget: 'var',
        library: 'GpxReplay',
    },
    optimization: {
        splitChunks: false,
    },
    externals: {},
};

if (process.env.BUILD_MODE === 'dist') {
    demoConfig.plugins.push(
        new MakeJsArtWebpackPlugin({
            imagePath: './static/minilogo.jpg',
            cutoff: 0.6,
            invert: true,
        })
    );
}

module.exports = [demoConfig, libraryConfig, scriptConfig];
