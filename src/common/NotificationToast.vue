<template>
    <div class="notification-wrapper">
        <div class="notification-grid">
            <div v-for="notification in notifications" :key="notification.id" :class="notification.nClass">
                <p>{{notification.message}}</p><a href="#" @click="removeNotification(notification.id)">X</a>
            </div>
        </div>
    </div>
</template>

<script>
import { NotificationService, NotificationType } from './notifications';

export default {
    created() {
        const service = NotificationService.getInstance();
        this.renderNotifications();
        service.on("change", () => {
            this.renderNotifications();
        });
    },

    data() {
        return {
            notifications: [],
        }
    },

    methods: {
        notificationClass(ty) {
            switch(ty) {
                case NotificationType.Success:
                    return 'notification-success';
                case NotificationType.Error:
                    return 'notification-error';
                default:
                    return 'notification-default';
            }
        },

        removeNotification(id) {
            NotificationService.getInstance().removeNotification(id);
        },

        renderNotifications() {
            this.notifications = NotificationService.getInstance().getNotifications().map(n => {
                return {
                    id: n.id,
                    message: n.message,
                    nClass: ['notification', this.notificationClass(n.ty)]
                }
            });
        }
    }
}
</script>

<style lang="scss" scoped>
    @import "../styles/colors.scss";
    @import "../styles/dims.scss";

    .notification-grid {
        margin-top: 2em;
        display: grid;
        grid-template-columns: auto;
        justify-content: center;
        pointer-events: auto;
    }

    .notification {
        padding: $dims-padding;
        width: 60em;
        display: grid;
        grid-template-columns: 1fr 1.5em;
    }

    .notification-default {
        background-color: grey;
    }

    .notification-success {
        background-color: $colors-success;
    }

    .notification-error {
        background-color: $colors-error;
    }
</style>