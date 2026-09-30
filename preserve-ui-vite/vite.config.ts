import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    define: {
        APP_NAME: JSON.stringify('Preserve'),
        APP_VERSION: JSON.stringify(require('./package.json').version),
        APP_SHA: JSON.stringify(
            require('child_process')
                .execSync('git rev-parse --short HEAD')
                .toString()
        ),
    },
    plugins: [vue()],
})
