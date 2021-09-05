import './styles/base.scss';
import './vendor/foundation-icons/foundation-icons.css';
import App from './App.vue';
import { createApp } from 'vue';
import { isMock } from './common/utils';

function startApp() {
    const app = createApp(App);
    app.mount('body');
}

if (isMock()) {
    import(/* webpackChunkName: "mock" */ './mock/index')
        .then((mocks) => {
            return mocks.initMocks();
        })
        .then(startApp);
} else {
    startApp();
}
