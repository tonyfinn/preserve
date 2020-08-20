import EventEmitter from './events';

export enum NotificationType {
    Default,
    Success,
    Error,
}

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    expiryTimeout: null | number;
}
export class NotificationService {
    nextId: number;
    notifications: Array<Notification>;
    onChange: EventEmitter<void>;
    onNotify: EventEmitter<Notification>;
    onExpire: EventEmitter<Notification>;
    static instance: NotificationService;

    constructor() {
        this.nextId = 0;
        this.notifications = [];
        this.onChange = new EventEmitter();
        this.onNotify = new EventEmitter();
        this.onExpire = new EventEmitter();
    }

    addNotification(
        message: string,
        type = NotificationType.Default,
        timeout = 10
    ): number {
        const id = this.nextId++;
        const notification: Notification = {
            id,
            message,
            type,
            expiryTimeout: null,
        };

        notification.expiryTimeout = window.setTimeout(() => {
            this.notifications = this.notifications.filter((x) => x.id !== id);
            notification.expiryTimeout = null;
            this.onExpire.trigger(notification);
            this.onChange.trigger();
        }, timeout * 1000);

        this.notifications.push(notification);
        this.onNotify.trigger(notification);
        this.onChange.trigger();

        return id;
    }

    removeNotification(id: number): void {
        const notification = this.notifications.find((x) => x.id === id);
        this.notifications = this.notifications.filter((x) => x.id !== id);
        if (notification && notification.expiryTimeout) {
            clearTimeout(notification.expiryTimeout);
            notification.expiryTimeout = null;
        }
        if (notification) {
            this.onExpire.trigger(notification);
            this.onChange.trigger();
        }
    }

    getNotifications(): Array<Notification> {
        return [...this.notifications];
    }

    static notify(
        message: string,
        type = NotificationType.Default,
        timeout = 10
    ): number {
        return NotificationService.getInstance().addNotification(
            message,
            type,
            timeout
        );
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
}
