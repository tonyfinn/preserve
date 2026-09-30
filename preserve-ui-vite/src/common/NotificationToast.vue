<template>
    <section
        data-testid="notification-tray"
        class="notification-wrapper"
        aria-label="Notifications"
    >
        <div class="notification-grid">
            <div
                data-testid="notification"
                v-for="notification in notifications"
                :key="notification.id"
                :class="notification.nClass"
            >
                <p data-testid="notification-message">
                    {{ notification.message }}
                </p>
                <a
                    data-testid="notification-close-button"
                    href="#"
                    @click="removeNotification(notification.id)"
                    >X</a
                >
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import {
    NotificationService,
    NotificationType,
    type Notification,
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

<style scoped>
.notification-grid {
    margin-top: 1em;
    display: grid;
    grid-template-columns: auto;
    justify-content: center;
    pointer-events: none;
}

.notification {
    padding: var(--dims-padding);
    width: 60em;
    max-width: 80vw;
    display: grid;
    grid-template-columns: 1fr 1.5em;
    border-radius: var(--dims-border-radius);
    pointer-events: auto;
}

.notification-default {
    background-color: var(--colors-info);
}

.notification-success {
    background-color: var(--colors-success);
    color: var(--colors-text-dark);
}

.notification-error {
    background-color: var(--colors-error);
    color: var(--colors-text-dark);
}
</style>
