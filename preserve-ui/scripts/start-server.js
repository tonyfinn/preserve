const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');

const express = require('express');

const app = express();

function pidFilePath() {
    if (process.env.PRESERVE_PIDFILE_PATH) {
        return process.env.PRESERVE_PIDFILE_PATH;
    }
    return path.join(os.tmpdir(), 'preserve-server.pid');
}

const preserve_path = process.env.PRESERVE_PATH || '../dist';
const port = parseInt(process.env.PRESERVE_PORT, 10) || 5678;

app.use('/', express.static(preserve_path));
app.listen(port, () => {
    fs.writeFileSync(pidFilePath(), `${process.pid}`, 'utf8');
    const portStr = port !== 80 ? `:${port}` : '';
    console.log(`Open http://localhost${portStr}/ in a web browser for the app`);
});

process.on('SIGTERM', () => {
    process.exit(0);
});

process.on('SIGINT', () => {
    process.exit(0);
});

process.on('exit', () => {
    fs.unlinkSync(pidFilePath());
});
