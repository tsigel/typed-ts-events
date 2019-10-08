export class EventEmitter<T extends Record<keyof any, any>> {

    private _events: Record<keyof T, Array<IEventData<T[keyof T], any>>> = Object.create(null);


    public hasListeners<K extends keyof T>(eventName: K): boolean {
        return !!(this._events[eventName] && this._events[eventName].length);
    }

    public getActiveEvents(): Array<keyof T> {
        return Object.keys(this._events).filter(name => this.hasListeners(name));
    }

    public trigger<K extends keyof T>(eventName: K, params: Readonly<T[K]>): void {
        if (this._events[eventName]) {
            this._events[eventName] = this._events[eventName].filter(data => {
                try {
                    data.handler.call(data.context, params);
                } catch (e) {

                }
                return !data.once;
            });
            if (!this._events[eventName].length) {
                delete this._events[eventName];
            }
        }
    }

    public on<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.IHandler<T[K], SELF>, context?: SELF): void {
        this._on(eventName, handler, context, false);
    }

    public once<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.IHandler<T[K], SELF>, context?: SELF): void {
        this._on(eventName, handler, context, true);
    }


    public off(): void
    public off(eventName: keyof T): void
    public off(handler: EventEmitter.IHandler<T[keyof T], any>): void
    public off(eventName: TOrEmpty<keyof T>, handler: TOrEmpty<EventEmitter.IHandler<T[keyof T], any>>): void
    public off<K extends keyof T>(arg1?: any, arg2?: any): void {
        const eventName: TOrEmpty<keyof T> = typeof arg1 === 'string' ? arg1 : null;
        const handler: TOrEmpty<EventEmitter.IHandler<T[keyof T], any>> = typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : null;

        if (!eventName) {
            Object.keys(this._events).forEach(eventName => {
                this.off(eventName as keyof T, handler);
            });
            return void 0;
        }

        if (!handler) {
            delete this._events[eventName];
            return void 0;
        }

        if (eventName in this._events) {
            this._events[eventName] = this._events[eventName].filter(item => item.handler !== handler);
        }
    }

    private _on<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.IHandler<T[K], SELF>, context: SELF | undefined, once: boolean): void {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }

        this._events[eventName].push({ handler, context, once });
    }
}

interface IEventData<T, SELF> {
    once: boolean;
    context: SELF;
    handler: EventEmitter.IHandler<T, SELF>;
}

type TOrEmpty<T> = T | null | undefined;

export namespace EventEmitter {

    export interface IHandler<T, SELF> {
        (this: SELF, data: Readonly<T>): any;
    }

}