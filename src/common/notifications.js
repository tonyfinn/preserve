import EventMixin from './events';

export const NotificationType = {
    Default: 0,
    Success: 1,
    Error: 2,
};

export class NotificationService extends EventMixin {
    constructor() {
        super();
        this.nextId = 0;
        this.notifications = [];
        this.changeHandlers = [];
    }

    addNotification(message, type = NotificationType.Default, timeout = 10) {
        const id = this.nextId++;
        const notification = {
            id,
            message,
            type,
        };

        this.notifications.push(notification);
        this.trigger('add', notification);
        this.trigger('change');

        notification.expiryTimeout = setTimeout(() => {
            this.notifications = this.notifications.filter((x) => x.id !== id);
            notification.expiryTimeout = null;
            this.trigger('expire', notification);
            this.trigger('change');
        }, timeout * 1000);

        return id;
    }

    removeNotification(id) {
        const notification = this.notifications.find((x) => x.id === id);
        this.notifications = this.notifications.filter((x) => x.id !== id);
        clearTimeout(notification.expiryTimeout);
        notification.expiryTimeout = null;
        this.trigger('expire', notification);
        this.trigger('change');
    }

    getNotifications() {
        return [...this.notifications];
    }

    static notify(message, type = NotificationType.Default, timeout = 10) {
        return NotificationService.getInstance().addNotification(
            message,
            type,
            timeout
        );
    }

    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
}
