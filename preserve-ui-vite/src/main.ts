import './styles/base.css';
import './vendor/foundation-icons/foundation-icons.css';
import App from './App.vue';
import { createApp } from 'vue';
import { isMock } from './common/utils';

function startApp() {
    const app = createApp(App);
    app.mount('body');
}

if (isMock()) {
    // TODO: Restore mock loading
    startApp();
} else {
    startApp();
}
