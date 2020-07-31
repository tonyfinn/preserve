const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require("vue-loader");
const TerserPlugin = require('terser-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: devMode ? 'development' : 'production',
    devtool: devMode ? 'inline-source-map' : 'source-map',
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
                    devMode ? 'style-loader' : {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: devMode,
                        }
                    },
                    'css-loader',
                    'sass-loader',
                ],
            },
            /**{
                test: /\.js$/,
                loader: 'babel-loader',
            }*/
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: devMode ? '[name].css' : '[name].[hash].css',
            chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
        }),
        new HtmlWebpackPlugin({
            title: 'Preserve',
            hash: !devMode,
        }),
        new VueLoaderPlugin(),
    ],
    optimization: {
        usedExports: true,
        minimizer: [new TerserPlugin()],
    }
}