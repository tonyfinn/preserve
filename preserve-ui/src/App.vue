<template>
    <div id="app">
        <header id="app-header">
            <div>
                <h1>{{ appName }}</h1>
                <p
                    :title="'VCS version: ' + appSha"
                    v-if="releaseVersionVisible"
                    @click.ctrl="releaseVersionVisible = false"
                >
                    v{{ appVersion }}
                </p>
                <p
                    v-if="!releaseVersionVisible"
                    @click.ctrl="releaseVersionVisible = true"
                >
                    {{ appSha }}
                </p>
            </div>
            <div class="user-menu">
                <p v-if="!loggedIn">Not Logged in</p>
                <p v-if="loggedIn">{{ userName }} ({{ serverName }})</p>
                <i
                    v-if="loggedIn"
                    class="fi-widget settings-icon"
                    title="Settings"
                    @click="settingsOpen = !settingsOpen"
                ></i>
                <settings-dialog
                    v-if="settingsOpen"
                    v-model="settings"
                    :queueManager="queueManager"
                    @close-settings="settingsOpen = false"
                ></settings-dialog>
                <div class="menu-contents">
                    <button v-if="loggedIn" @click="logout()">Logout</button>
                </div>
            </div>
        </header>
        <playback-screen
            v-if="appLoaded && loggedIn"
            :library="library"
            :queueManager="queueManager"
            :settings="settings"
            class="screen-root"
        ></playback-screen>
        <login-screen
            v-if="appLoaded && !loggedIn"
            class="screen-root"
            @login-complete="setupServer($event.loginResult)"
        ></login-screen>
        <div id="loading-spinner" v-if="!appLoaded">
            <h1>Loading</h1>
            <p v-for="loadingItem in loadingItems" :key="loadingItem.name">
                {{ loadingItem.name }}: {{ loadingItem.loadedCount }} /
                {{ loadingItem.total > 0 ? loadingItem.total : 'Unknown' }}
            </p>
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
import SettingsDialog from './SettingsDialog.vue';
import { Settings, SETTINGS_STORAGE_KEY } from './common/settings';

interface LoadingItem {
    name: string;
    total: number;
    loadedCount: number;
}

export default defineComponent({
    components: {
        LoginScreen,
        PlaybackScreen,
        NotificationToast,
        SettingsDialog,
    },
    data() {
        const settingsString = window.localStorage.getItem(
            SETTINGS_STORAGE_KEY
        );
        const savedSettings: Partial<Settings> = settingsString
            ? JSON.parse(settingsString)
            : {};
        const settings = new Settings(savedSettings);
        const library = Library.createInstance();
        return {
            settings,
            /* eslint-disable -- eslint does not understand these values from DefinePlugin */
            appName: APP_NAME,
            appVersion: APP_VERSION,
            appSha: APP_SHA,
            /* eslint-enable */
            loggedIn: false,
            library,
            servers: connectionManager.getSavedServers() || [],
            queueManager: null as QueueManager | null,
            releaseVersionVisible: true,
            settingsOpen: false,
            userName: '',
            serverName: '',
        };
    },
    provide() {
        return {
            library: this.library,
            settings: this.settings,
        };
    },
    computed: {
        appLoaded(): boolean {
            return (
                this.servers.length === 0 ||
                (this.library.loadingState.done && this.queueManager !== null)
            );
        },
        loadingItems(): Array<LoadingItem> {
            return [
                {
                    name: 'Artists',
                    total: this.library.loadingState.artistTotal,
                    loadedCount: this.library.loadingState.artistLoaded,
                },
                {
                    name: 'Albums',
                    total: this.library.loadingState.albumTotal,
                    loadedCount: this.library.loadingState.albumLoaded,
                },
                {
                    name: 'Tracks',
                    total: this.library.loadingState.trackTotal,
                    loadedCount: this.library.loadingState.trackLoaded,
                },
            ];
        },
    },
    created() {
        if (this.servers.length > 0) {
            connectionManager
                .connectToServers(this.servers)
                .then((conResult) => {
                    if (conResult.State === 'SignedIn') {
                        return conResult as LoggedInConnectionResult;
                    }
                    console.log(conResult);
                    return Promise.reject('Not signed in previously');
                })
                .then(this.setupServer.bind(this))
                .catch((err) => {
                    console.log(err);
                    NotificationService.notifyError(err);
                    this.loggedIn = false;
                    this.servers = [];
                });
        }
        this.$watch(
            'settings',
            (newSettings: Settings) => {
                newSettings.save();
            },
            { deep: true, immediate: true }
        );
    },
    methods: {
        logout() {
            connectionManager.logout().then(() => {
                this.loggedIn = false;
            });
        },
        async setupServer(conResult: SuccessfulConnectionResult) {
            const server = conResult.Servers[0];
            this.loggedIn = server.AccessToken !== null;
            if (this.loggedIn) {
                this.serverName = server.Name || '';
                this.servers = connectionManager.getSavedServers();
                this.userName = (
                    await conResult.ApiClient.getCurrentUser()
                ).Name;
                await this.library.populate(conResult.ApiClient);
                this.queueManager = await QueueManager.create(this.library);
                NotificationService.notify(
                    `Logged in to ${server.Name}`,
                    NotificationType.Success,
                    3
                );
            }
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
    display: grid;
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    align-content: start;

    h1 {
        font-size: 3em;
    }
    p,
    h1 {
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

    div {
        display: grid;
        grid-auto-flow: column;
        justify-content: start;
        grid-gap: 1em;
        align-items: center;
    }

    .settings-icon {
        cursor: pointer;
    }
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
