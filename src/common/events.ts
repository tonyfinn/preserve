interface EventHandler<T> {
    id: number;
    fn: (evt: T) => void;
}

export default class EventEmitter<T> {
    eventHandlers: Array<EventHandler<T>>;
    nextHandlerId: number;

    constructor() {
        this.eventHandlers = [];
        this.nextHandlerId = 0;
    }

    on(fn: (evt: T) => void): number {
        const id = this.nextHandlerId++;
        this.eventHandlers.push({ id, fn });
        return id;
    }

    off(id: number): void {
        this.eventHandlers = this.eventHandlers.filter((x) => x.id !== id);
    }

    trigger(evt: T): void {
        for (const handler of this.eventHandlers) {
            handler.fn(evt);
        }
    }
}
