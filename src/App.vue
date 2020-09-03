<template>
    <div id="app">
        <header id="app-header">
            <h1>Preserve</h1>
            <button v-if="loggedIn" @click="logout()">Logout</button>
        </header>
        <playback-screen
            v-if="loaded && loggedIn"
            :library="library"
            :queueManager="queueManager"
            class="screen-root"
        ></playback-screen>
        <login-screen
            v-if="loaded && !loggedIn"
            class="screen-root"
            @login-complete="setupServer($event.loginResult)"
        ></login-screen>
        <div id="loading-spinner" v-if="!loaded">
            <p>Loading...</p>
        </div>
        <notification-toast class="notification-outlet"></notification-toast>
        <div id="dialog-container"></div>
    </div>
</template>

<script lang="ts">
import PlaybackScreen from './PlaybackScreen.vue';
import LoginScreen from './auth/LoginScreen.vue';
import { connectionManager } from './common/connections';
import { Library } from './library';
import { NotificationType, NotificationService } from './common/notifications';
import NotificationToast from './common/NotificationToast.vue';
import { defineComponent } from 'vue';
import {
    LoggedInConnectionResult,
    SuccessfulConnectionResult,
} from 'jellyfin-apiclient';
import { QueueManager } from './queues/play-queue';

export default defineComponent({
    components: {
        LoginScreen,
        PlaybackScreen,
        NotificationToast,
    },
    data() {
        return {
            loggedIn: false,
            loaded: false,
            library: null as Library | null,
            queueManager: null as QueueManager | null,
        };
    },
    created() {
        const servers = connectionManager.getSavedServers();
        if (servers.length == 0) {
            this.loaded = true;
        } else {
            connectionManager
                .connectToServers(servers)
                .then((conResult) => {
                    if (conResult.State === 'SignedIn') {
                        return conResult as LoggedInConnectionResult;
                    }
                    return Promise.reject('Not signed in previously');
                })
                .then(this.setupServer.bind(this))
                .catch((err) => {
                    console.log(err);
                    this.loggedIn = false;
                    this.loaded = true;
                });
        }
    },
    methods: {
        logout() {
            connectionManager.logout().then(() => {
                this.loggedIn = false;
            });
        },
        async setupServer(conResult: SuccessfulConnectionResult) {
            const server = conResult.Servers[0];
            this.library = Library.createInstance(connectionManager);
            this.queueManager = await QueueManager.create(this.library);
            this.loggedIn = server.AccessToken !== null;
            this.loaded = true;
            NotificationService.notify(
                `Logged in to ${server.Name}`,
                NotificationType.Success,
                3
            );
        },
    },
});
</script>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#app {
    display: grid;
    height: 100vh;
    width: 100vw;
    grid-template-rows: auto minmax(0, 1fr);
}

#loading-spinner {
    font-size: 5em;
    display: grid;

    justify-content: middle;
    align-items: center;

    & p {
        margin: auto;
    }
}

#app-header {
    background-color: $colors-primary;
    grid-row: 1;
    grid-column: 1;
    padding: $dims-padding;
    display: grid;
    grid-template-columns: 1fr auto;
}

.notification-outlet {
    grid-row: 1 / 3;
    grid-column: 1;
    pointer-events: none;
    z-index: 10;
}

#dialog-container {
    grid-row: 1 / 3;
    grid-column: 1;
    pointer-events: none;
    z-index: 5;
}

.screen-root {
    grid-row: 2;
    grid-column: 1;
}
</style>
