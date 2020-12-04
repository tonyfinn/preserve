/* eslint-disable */
const { spawn } = require('child_process');
const process = require('process');
const port = process.env.WEBPACK_DEV_PORT || 9005;

const webpackConfig = require('./webpack.config.js');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server/lib/Server');

let cypressLaunched = false;

const webpackDevOptions = Object.assign({}, webpackConfig.devServer);

const compiler = webpack(webpackConfig);

const webpackDevServer = new WebpackDevServer(compiler, webpackDevOptions);

function startCypress() {
    const cypress = spawn('node_modules/.bin/cypress', [
        'run',
        '--config',
        `baseUrl=http://localhost:${port}`,
    ]);
    cypressLaunched = true;

    cypress.on('exit', (code) => {
        webpackDevServer.close(() => {
            process.exit(code);
        });
    });

    cypress.stdout.on('data', (data) => {
        console.log('Cyp: ', data.toString().replace(/\n/g, '\n      '));
    });

    cypress.stderr.on('data', (data) => {
        console.error('Cyp: ', data.toString().replace(/\n/g, '\n      '));
    });
}

webpackDevServer.listen(port, '127.0.0.1', (err) => {
    if (err) {
        console.error('Webpack: ', err);
    }
});

compiler.hooks.done.tap('PreserveTestRunner', () => {
    console.log('Compile done, starting cypress');
    startCypress();
});
