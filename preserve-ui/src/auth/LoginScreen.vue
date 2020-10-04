<template>
    <div id="login-form">
        <h2>Login</h2>

        <form @submit.prevent="login">
            <label for="server-name">Jellyfin Server Address</label>
            <input
                id="server-name"
                v-model="serverName"
                type="text"
                placeholder="https://example.com"
            />
            <label for="username">Username</label>
            <input type="text" v-model="username" placeholder="Username" />
            <label for="username">Password</label>
            <input type="password" v-model="password" placeholder="Password" />
            <input type="submit" value="Login" />
        </form>
    </div>
</template>

<script lang="ts">
import { connectionManager } from '../common/connections';
import { NotificationService, NotificationType } from '../common/notifications';
import { defineComponent } from 'vue';
import {
    ServerConnectionResult,
    LoggedInConnectionResult,
    LoggedOutConnectionResult,
    SuccessfulConnectionResult,
} from 'jellyfin-apiclient';

function isSignedInState(
    result: ServerConnectionResult
): result is LoggedInConnectionResult | LoggedOutConnectionResult {
    return result.State == 'SignedIn' || result.State === 'ServerSignIn';
}

interface LoginEvent {
    loginResult: SuccessfulConnectionResult;
}

export default defineComponent({
    emits: ['login-complete'],
    data: function () {
        return {
            username: '',
            password: '',
            serverName: '',
            message: '',
            loginSuccess: false,
        };
    },
    methods: {
        async login(): Promise<void> {
            const result = await connectionManager.connectToServer({
                RemoteAddress: this.serverName,
            });

            if (result.State === 'ServerUpdateNeeded') {
                this.message = 'The server is too old for use with Preserve';
                return;
            } else if (result.State === 'Unavailable') {
                this.message = 'Could not connect to server';
                return;
            } else if (isSignedInState(result)) {
                if (result.ApiClient) {
                    const apiClient = result.ApiClient;

                    try {
                        await apiClient.authenticateUserByName(
                            this.username,
                            this.password
                        );
                        this.loginSuccess = true;
                        NotificationService.notify(
                            'Successfully logged in',
                            NotificationType.Success
                        );
                        this.$emit('login-complete', {
                            loginResult: result,
                        });
                    } catch (e) {
                        console.error(e);
                        NotificationService.notify(
                            'Failed to authenticate. Username or password incorrect',
                            NotificationType.Error
                        );
                        return;
                    }
                }
            } else {
                const state = result.State;
                this.message = `Server in unknown state ${state}`;
                return;
            }
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
}

#login-form .message {
    color: $colors-text-dark;
    padding: $dims-padding-dense;
    margin: 0.5em 0;
    border-radius: $dims-border-radius;
    background-color: $colors-success;

    &.error {
        background-color: $colors-error;
    }
}

#login-form {
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
