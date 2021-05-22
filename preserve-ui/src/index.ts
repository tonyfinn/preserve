import './styles/base.scss';
import './vendor/foundation-icons/foundation-icons.css';
import App from './App.vue';
import { createApp } from 'vue';
import { isMock } from './common/utils';

class Foo {
    constructor(private readonly foo: string, public readonly foobar: string) {}
}

function bar(item: Foo) {
    console.log(item.foobar);
}

const foo = new Foo('babc', 'xyz');
bar(foo);

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
