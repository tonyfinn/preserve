export default class EventMixin {
    constructor() {
        this.eventHandlers = {};
        this.nextHandlerId = 0;
    }

    on(eventName, handler) {
        const id = this.nextHandlerId++;
        handler = {
            id,
            fn: handler
        };

        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].push(handler);
        } else {
            this.eventHandlers[eventName] = [handler];
        }
    }

    off(eventName, handlerId) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(x => x.id !== handlerId);
        }
    }

    trigger(eventName, ...params) {
        if (this.eventHandlers[eventName]) {
            for (const handler of this.eventHandlers[eventName]) {
                handler.fn(...params)
            }
        }
    }
}