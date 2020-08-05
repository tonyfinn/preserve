<template>
    <div id="login-form">
        <h2>Login</h2>

        <form @submit.prevent="login">
            <label for="server-name">Server Name</label>
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

<script>
import { connectionManager } from '../common/connections';
import { NotificationService, NotificationType } from '../common/notifications';

export default {
    data: function () {
        return {
            username: '',
            password: '',
            serverName: '',
            message: '',
            loginSuccess: false,
            apiClient: null,
        };
    },
    methods: {
        async login() {
            const result = await connectionManager.connectToServer({
                RemoteAddress: this.serverName,
            });

            if (result.State === 'ServerUpdateNeeded') {
                this.message = 'The server is too old for use with Preserve';
                return;
            } else if (result.State === 'Unavailable') {
                this.message = 'Could not connect to server';
                return;
            } else if (
                result.State !== 'SignedIn' &&
                result.State !== 'ServerSignIn'
            ) {
                this.message = `Server in unknown state ${result.State}`;
                return;
            }

            this.apiClient = result.ApiClient;

            try {
                await this.apiClient.authenticateUserByName(
                    this.username,
                    this.password
                );
                this.loginSuccess = true;
                NotificationService.notify(
                    'Successfully logged in',
                    NotificationType.Success
                );
            } catch (e) {
                NotificationService.notify(
                    'Failed to authenticate. Username or password incorrect',
                    NotificationType.Error
                );
                return;
            }
        },
    },
};
</script>

<style lang="scss">
@import '../styles/colors.scss';

#login-form {
    width: 30em;
    margin: 1em auto;
}

#login-form .message {
    color: $colors-text-dark;
    padding: 0.2em;
    margin: 0.5em 0;
    border-radius: 5px;
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
