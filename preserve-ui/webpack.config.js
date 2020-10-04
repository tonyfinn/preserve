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
    },
    entry: {
        main: './src/index.ts',
    },
    output: {
        filename: devMode ? '[name].js' : '[name].[hash].js',
        path: path.resolve(__dirname, '../dist'),
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.(png|gif|svg)$/,
                loader: 'file-loader',
            },
            {
                test: /\.scss$/,
                use: [
                    devMode
                        ? 'style-loader'
                        : {
                              loader: MiniCssExtractPlugin.loader,
                              options: {
                                  hmr: devMode,
                              },
                          },
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    devMode
                        ? 'style-loader'
                        : {
                              loader: MiniCssExtractPlugin.loader,
                              options: {
                                  hmr: devMode,
                              },
                          },
                    'css-loader',
                ],
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: { appendTsSuffixTo: [/\.vue$/] },
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader?limit=10000&mimetype=application/font-woff',
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader',
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: devMode ? '[name].css' : '[name].[hash].css',
            chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
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
    ],
    optimization: {
        usedExports: true,
        minimizer: [new TerserPlugin()],
    },
};
