const express = require('express');
const process = require('process');
const app = express();

const preserve_path = process.env.PRESERVE_PATH || '/usr/local/share/webapps/preserve';
const port = parseInt(process.env.PRESERVE_PORT, 10) || 5678;

app.use('/', express.static(preserve_path));
app.listen(port, () => {
    const portStr = port !== 80 ? `:${port}` : '';
    console.log(`Open http://localhost${portStr}/ in a web browser for the app`);
});

process.on('SIGTERM', () => {
    process.exit(0);
});
