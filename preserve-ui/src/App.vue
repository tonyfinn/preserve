<template>
    <div id="app">
        <header id="app-header">
            <div>
                <h1>{{ appName }}</h1>
                <p
                    aria-hidden="true"
                    :title="'VCS version: ' + appSha"
                    v-if="releaseVersionVisible"
                    @click.ctrl="releaseVersionVisible = false"
                >
                    v{{ appVersion }}
                </p>
                <p
                    aria-hidden="true"
                    :title="'VCS version: ' + appSha"
                    v-if="!releaseVersionVisible"
                    @click.ctrl="releaseVersionVisible = true"
                >
                    {{ appSha }}
                </p>
            </div>
            <div class="user-menu">
                <div class="loading-progress" v-if="!libraryManager.allLoaded">
                    <i
                        class="loading-spinner-icon fi-loop"
                        aria-label="Loading"
                    ></i>
                    {{ libraryManager.loadedCount() }} /
                    {{ libraryManager.loadingTotal() }}
                </div>
                <p v-if="!loggedIn">Not Logged in</p>
                <p v-if="loggedIn">
                    <span
                        data-testid="loggedin-username"
                        aria-label="User"
                        title="Username"
                        >{{ username }}</span
                    >
                    (<span
                        data-testid="loggedin-server-name"
                        aria-label="Server"
                        title="Active Server"
                        >{{ serverName }}</span
                    >)
                </p>
                <i
                    v-if="loggedIn"
                    class="fi-widget settings-icon"
                    aria-label="settings"
                    role="button"
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
            :queueManager="queueManager"
            :libraryManager="libraryManager"
            :settings="settings"
            class="screen-root"
        ></playback-screen>
        <login-screen
            v-if="appLoaded && !loggedIn"
            class="screen-root"
            :serverManager="serverManager"
            @login-complete="setupServers"
        ></login-screen>
        <div id="loading-spinner" v-if="!appLoaded && loggedIn">
            <h1>Loading</h1>
        </div>
        <notification-toast class="notification-outlet"></notification-toast>
        <div id="dialog-container"></div>
    </div>
</template>

<script lang="ts">
import PlaybackScreen from './PlaybackScreen.vue';
import LoginScreen from './auth/LoginScreen.vue';
import { ServerManager } from './common/servers';
import { NotificationService } from './common/notifications';
import NotificationToast from './common/NotificationToast.vue';
import { defineComponent } from 'vue';
import { QueueManager } from './queues/play-queue';
import SettingsDialog from './SettingsDialog.vue';
import { Settings, STORAGE_KEY_SETTINGS } from './common/settings';
import { LibraryManager } from './library';

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
            STORAGE_KEY_SETTINGS
        );
        const savedSettings: Partial<Settings> = settingsString
            ? JSON.parse(settingsString)
            : {};
        const settings = new Settings(savedSettings);
        const serverManager = new ServerManager();
        const libraryManager = new LibraryManager(serverManager);
        return {
            settings,
            /* eslint-disable -- eslint does not understand these values from DefinePlugin */
            appName: APP_NAME,
            appVersion: APP_VERSION,
            appSha: APP_SHA,
            /* eslint-enable */
            loggedIn: false,
            reconnectComplete: false,
            serverManager,
            libraryManager,
            queueManager: null as QueueManager | null,
            releaseVersionVisible: true,
            settingsOpen: false,
            username: '',
            serverName: '',
        };
    },
    provide() {
        return {
            libraryManager: this.libraryManager,
            settings: this.settings,
        };
    },
    computed: {
        appLoaded(): boolean {
            return (
                this.reconnectComplete &&
                ((this.loggedIn && this.libraryManager.allReady()) ||
                    !this.loggedIn)
            );
        },
    },
    created() {
        this.tryReconnect();
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
            const logoutPromises = this.serverManager
                .activeServers()
                .map((s) => this.serverManager.logout(s));
            Promise.all(logoutPromises).then(() => (this.loggedIn = false));
        },
        async tryReconnect(): Promise<void> {
            if (this.serverManager.knownServers().length > 0) {
                try {
                    await this.serverManager.reconnect();
                    await this.setupServers();
                } catch (err) {
                    console.log(err);
                    NotificationService.notifyError(err);
                    this.loggedIn = false;
                    this.reconnectComplete = true;
                }
            } else {
                this.reconnectComplete = true;
            }
        },
        async setupServers() {
            this.reconnectComplete = false;
            const activeServers = this.serverManager.activeServers();
            console.log('New servers: ', activeServers);
            if (activeServers.length > 0) {
                this.loggedIn = true;
                activeServers[0]
                    .username()
                    .then((username) => (this.username = username));
                activeServers[0]
                    .serverName()
                    .then((serverName) => (this.serverName = serverName));
                this.queueManager = await QueueManager.create(
                    this.libraryManager
                );
                this.reconnectComplete = true;
            } else {
                this.loggedIn = false;
                this.reconnectComplete = true;
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

.loading-spinner-icon::before {
    animation-duration: 1s;
    animation-name: spin;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
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
