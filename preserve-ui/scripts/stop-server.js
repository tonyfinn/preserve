const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');

function pidFilePath() {
    if (process.env.PRESERVE_PIDFILE_PATH) {
        return process.env.PRESERVE_PIDFILE_PATH;
    }
    return path.join(os.tmpdir(), 'preserve-server.pid');
}

try {
    const pidStr = fs.readFileSync(pidFilePath(), 'utf8');
    const pid = parseInt(pidStr, 10);

    try {
        process.kill(pid, 'SIGTERM');
        console.log(`Sent SIGTERM to Preserve server process ${pid}`)
    } catch(e) {
        console.error(`Could not terminate process ${pid}`, e);
        process.exit(2);
    }
} catch(e) {
    console.error('Could not find PID of running process', e);
    process.exit(1);
}
