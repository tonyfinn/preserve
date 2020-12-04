<template>
    <form
        id="login-form"
        data-testid="login-form"
        @submit.prevent="login"
        aria-labelledby="login-form-header"
    >
        <h2 id="login-form-header">Login</h2>
        <label for="server-address-input">Jellyfin Server Address</label>
        <input
            id="server-address-input"
            data-testid="login-server-address-input"
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
import { JELLYFIN_SERVER_TYPE } from '../api';

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
        };
    },
    methods: {
        async login(): Promise<void> {
            try {
                const server = await this.serverManager.connect(
                    JELLYFIN_SERVER_TYPE,
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
