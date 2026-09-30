<template>
    <form
        id="login-form"
        data-testid="login-form"
        @submit.prevent="login"
        aria-labelledby="login-form-header"
    >
        <h2 id="login-form-header">Login</h2>

        <p
            v-if="serverTestTesting || serverTestMessage !== null"
            :class="{
                'server-test': true,
                'server-test-testing': serverTestTesting,
                'server-test-failed': !serverTestTesting && !serverTestSuccess,
                'server-test-success': !serverTestTesting && serverTestSuccess,
            }"
        >
            <template v-if="!serverTestTesting">
                {{ serverTestMessage }}
            </template>
            <template v-if="serverTestTesting">
                <i class="loading-spinner-icon fi-loop" aria-hidden="true"></i>
                Checking for {{ serverType }} server on {{ serverTestAddress }}
            </template>
        </p>
        <label for="server-address-input">Jellyfin Server Address</label>
        <input
            id="server-address-input"
            data-testid="login-server-address-input"
            @change="testServerAddress"
            v-model="serverAddress"
            type="text"
            placeholder="https://example.com"
        />
        <label for="username-input">Username</label>
        <input
            id="username-input"
            type="text"
            data-testid="login-username-input"
            v-model="username"
            placeholder="Username"
        />
        <label for="password-input">Password</label>
        <input
            id="password-input"
            type="password"
            data-testid="login-password-input"
            v-model="password"
            placeholder="Password"
        />
        <input type="submit" value="Login" />
    </form>
</template>

<script lang="ts">
import { NotificationService, NotificationType } from '../common/notifications';
import { defineComponent } from 'vue';
import { ServerManager } from '../common/servers';
import { JELLYFIN_SERVER_TYPE, ServerType } from '../api';
import { MediaServerTestResult } from '../api/interface';

interface ServerResolveResult {
    address: string;
    result: MediaServerTestResult;
}

export default defineComponent({
    emits: ['login-complete'],
    props: {
        serverManager: {
            required: true,
            type: ServerManager,
        },
    },
    data: function () {
        return {
            username: '',
            password: '',
            serverAddress: '',
            loginSuccess: false,
            serverTestMessage: null as string | null,
            serverTestSuccess: false,
            serverTestTesting: false,
            serverTestAddress: '',
            serverType: JELLYFIN_SERVER_TYPE as ServerType,
        };
    },
    methods: {
        async login(): Promise<void> {
            try {
                const server = await this.serverManager.connect(
                    this.serverType,
                    this.serverAddress,
                    this.username,
                    this.password
                );
                this.loginSuccess = true;
                NotificationService.notify(
                    'Successfully logged in',
                    NotificationType.Success
                );
                this.$emit('login-complete', server.serverId());
            } catch (e) {
                console.error(e);
                NotificationService.notify(
                    'Failed to authenticate. Username or password incorrect',
                    NotificationType.Error
                );
            }
        },
        async resolveServerAddress(
            address: string
        ): Promise<ServerResolveResult> {
            const addressesToTry = [address];
            if (!address.includes('://')) {
                addressesToTry.push('https://' + address.trim());
                addressesToTry.push('http://' + address.trim());
            }
            for (const address of addressesToTry) {
                this.serverTestAddress = address.trim();
                const test = await this.serverManager.test(
                    this.serverType,
                    this.serverTestAddress
                );
                if (test !== MediaServerTestResult.NoServer) {
                    return { address: this.serverTestAddress, result: test };
                }
            }
            return {
                address,
                result: MediaServerTestResult.NoServer,
            };
        },
        async testServerAddress(): Promise<void> {
            this.serverTestTesting = true;
            const resolve = await this.resolveServerAddress(this.serverAddress);
            if (resolve.result === MediaServerTestResult.Success) {
                this.serverAddress = resolve.address;
                this.serverTestSuccess = true;
                this.serverTestMessage = `Server found: ${resolve.address}`;
            } else if (resolve.result === MediaServerTestResult.InvalidServer) {
                this.serverTestSuccess = false;
                this.serverTestMessage = `Not a valid server: ${resolve.address}`;
            } else if (resolve.result === MediaServerTestResult.NoServer) {
                this.serverTestSuccess = false;
                this.serverTestMessage = `Could not connect to server: ${resolve.address}`;
            }
            this.serverTestTesting = false;
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

#login-form {
    width: 30em;
    margin: 1em auto;

    .server-test {
        border-radius: $dims-border-radius-subtle;
        padding: $dims-padding-dense;
        margin: $dims-padding 0;
    }

    .server-test-testing {
        background: $colors-info;
    }

    .server-test-failed {
        background: $colors-error;
        color: $colors-text-dark;
    }

    .server-test-success {
        background: $colors-success;
        color: $colors-text-dark;
    }

    label,
    input {
        display: block;
        width: 100%;
    }

    input {
        margin-bottom: 1em;
    }
}
</style>
