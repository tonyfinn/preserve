<template>
    <section class="notification-wrapper" aria-label="Notifications">
        <div class="notification-grid">
            <div
                v-for="notification in notifications"
                :key="notification.id"
                :class="notification.nClass"
            >
                <p>{{ notification.message }}</p>
                <a href="#" @click="removeNotification(notification.id)">X</a>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import {
    NotificationService,
    NotificationType,
    Notification,
} from './notifications';
import { defineComponent } from 'vue';

interface NotificationDisplay {
    id: number;
    message: string;
    nClass: Array<string>;
}

export default defineComponent({
    created(): void {
        const service = NotificationService.getInstance();
        this.renderNotifications();
        service.onChange.on(() => {
            this.renderNotifications();
        });
    },

    data() {
        return {
            notifications: [] as Array<NotificationDisplay>,
        };
    },

    methods: {
        notificationClass(ty: NotificationType): string {
            switch (ty) {
                case NotificationType.Success:
                    return 'notification-success';
                case NotificationType.Error:
                    return 'notification-error';
                default:
                    return 'notification-default';
            }
        },

        removeNotification(id: number): void {
            NotificationService.getInstance().removeNotification(id);
        },

        renderNotifications(): void {
            this.notifications = NotificationService.getInstance()
                .getNotifications()
                .map((n: Notification) => {
                    return {
                        id: n.id,
                        message: n.message,
                        nClass: [
                            'notification',
                            this.notificationClass(n.type),
                        ],
                    };
                });
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/colors.scss';
@import '../styles/dims.scss';

.notification-grid {
    margin-top: 1em;
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
    border-radius: $dims-border-radius;
}

.notification-default {
    background-color: grey;
}

.notification-success {
    background-color: $colors-success;
    color: $colors-text-dark;
}

.notification-error {
    background-color: $colors-error;
    color: $colors-text-dark;
}
</style>
