const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: devMode ? 'development' : 'production',
    devtool: devMode ? 'inline-source-map' : 'source-map',
    resolve: {
        extensions: ['.ts', '.js', '.vue'],
        alias: {
            'preserve-ui': path.resolve(__dirname),
        },
    },
    entry: {
        main: './src/index.ts',
        // mock: './src/mock/index.ts',
    },
    output: {
        filename: devMode ? '[name].js' : '[name].[contenthash].js',
        path: path.resolve(__dirname, '../dist'),
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.(png|gif|svg|ogg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.scss$/,
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { appendTsSuffixTo: [/\.vue$/], transpileOnly: true },
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                type: 'asset',
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: devMode ? '[name].css' : '[name].[contenthash].css',
            chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
        }),
        new HtmlWebpackPlugin({
            favicon: 'static/favicon.ico',
            hash: !devMode,
            title: 'Preserve',
        }),
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            APP_NAME: JSON.stringify('Preserve'),
            APP_VERSION: JSON.stringify(require('./package.json').version),
            APP_SHA: JSON.stringify(
                require('child_process')
                    .execSync('git rev-parse --short HEAD')
                    .toString()
            ),
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: '../tsconfig.json',
                extensions: {
                    vue: {
                        enabled: true,
                        compiler: '@vue/compiler-sfc',
                    },
                },
            },
            eslint: {
                files: './src/**/*.{ts,js,vue}',
            },
        }),
    ],
    optimization: {
        usedExports: true,
        minimizer: [new TerserPlugin()],
    },
};
