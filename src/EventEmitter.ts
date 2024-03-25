import Handler = EventEmitter.Handler;

export class EventEmitter<T extends Record<keyof any, any>> {

    protected readonly catchHandler: (e: Error) => void;
    protected readonly _eId: string;
    private _events: EventDataStorage<T> = Object.create(null);
    private _outEvents: OutEventStorage = Object.create(null);

    constructor(catchHandler?: (e: Error) => void) {
        this._eId = EventEmitter.makeId();
        this.catchHandler = catchHandler || (() => undefined);
    }

    public listenTo<E extends ListenEmitter<any>, K extends keyof EmitterEvents<E>, Self = undefined>(emitter: E, event: K, handler: EventEmitter.Handler<EmitterEvents<E>[K], Self>, self?: Self): this {
        this._saveOutEvent({
            event, handler, emitter
        });
        emitter.on(event, handler, self);
        return this;
    }

    public listenToOnce<E extends ListenEmitter<any>, K extends keyof EmitterEvents<E>, Self = undefined>(emitter: E, event: K, handler: EventEmitter.Handler<EmitterEvents<E>[K], Self>, context?: Self): this {
        const self = this;
        const proxy: EventEmitter.Handler<EmitterEvents<E>[K], Self> = function (data) {
            handler.call(this, data);
            self.stopListenTo(emitter, event, handler);
        };
        this._saveOutEvent({ event, handler, emitter, proxy });
        emitter.once(event, proxy, context);

        return this;
    }

    public stopListenTo<E extends ListenEmitter<any>, K extends keyof EmitterEvents<E>>(emitter: E, event?: K, handler?: EventEmitter.Handler<EmitterEvents<E>[K], any>): this {
        if (!this._outEvents[(emitter as any)._eId]) {
            return this;
        }

        const events = event ? [event] : Object.keys(this._outEvents[(emitter as any)._eId].events) as Array<K>;

        events.forEach((eventName) => {
            if (!this._outEvents[(emitter as any)._eId].events[eventName]) {
                return void 0;
            }

            this._outEvents[(emitter as any)._eId].events[eventName].slice().forEach((outHandler) => {
                if (handler && handler !== outHandler.handler) {
                    return void 0;
                }

                if (outHandler.proxy) {
                    emitter.off(eventName, outHandler.proxy);
                } else {
                    emitter.off(eventName, outHandler.handler);
                }
                const handlers = this._outEvents[(emitter as any)._eId].events[eventName];
                const index = handlers.indexOf(outHandler);

                if (index !== -1) {
                    handlers.splice(index, 1);
                }

                if (!this._outEvents[(emitter as any)._eId].events[eventName].length) {
                    delete this._outEvents[(emitter as any)._eId].events[eventName];
                }

                return void 0;
            });

            if (!Object.keys(this._outEvents[(emitter as any)._eId].events).length) {
                delete this._outEvents[(emitter as any)._eId];
            }

            return void 0;
        });

        return this;
    }

    public hasListeners<K extends keyof T>(eventName: K): boolean {
        return !!(this._events[eventName] && this._events[eventName].length);
    }

    public getActiveEvents(): Array<keyof T> {
        return Object.keys(this._events).filter(name => this.hasListeners(name));
    }

    protected trigger<K extends keyof T>(eventName: K, params: T[K]): this {
        if (!this._events[eventName]) {
            return this;
        }
        this._events[eventName].slice().forEach(data => {
            try {
                data.handler.call(data.context, params);
            } catch (e: unknown) {
                this.catchHandler(e as Error);
            }
            if (data.once) {
                this.off(eventName, data.handler);
            }
        });

        if (!this._events[eventName].length) {
            delete this._events[eventName];
        }

        return this;
    }

    public on<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.Handler<T[K], SELF>, context?: SELF): this {
        return this._on(eventName, handler, context, false);
    }

    public once<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.Handler<T[K], SELF>, context?: SELF): this {
        return this._on(eventName, handler, context, true);
    }


    public off(): this
    public off(eventName: keyof T): this
    public off(handler: EventEmitter.Handler<T[keyof T], any>): this
    public off(eventName: TOrEmpty<keyof T>, handler: TOrEmpty<EventEmitter.Handler<T[keyof T], any>>): this
    public off<K extends keyof T>(eventName: K, handler: TOrEmpty<EventEmitter.Handler<T[K], any>>): this
    public off<K extends keyof T>(arg1?: any, arg2?: any): this {
        const eventName: TOrEmpty<keyof T> = typeof arg1 === 'string' ? arg1 : null;
        const handler: TOrEmpty<EventEmitter.Handler<T[keyof T], any>> = typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : null;

        if (!eventName) {
            Object.keys(this._events).forEach(eventName => {
                this.off(eventName as keyof T, handler);
            });
            return this;
        }

        if (!handler) {
            delete this._events[eventName];
            return this;
        }

        if (eventName in this._events) {
            const index = this._events[eventName].map(item => item.handler).indexOf(handler);
            this._events[eventName].splice(index, 1);
        }

        return this;
    }

    private _on<K extends keyof T, SELF = undefined>(eventName: K, handler: EventEmitter.Handler<T[K], SELF>, context: SELF | undefined, once: boolean): this {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }

        this._events[eventName].push({ handler, context, once });

        return this;
    }

    private _saveOutEvent<E extends ListenEmitter<any>, K extends keyof EmitterEvents<E>, Self = undefined>({
                                                                                                               emitter,
                                                                                                               event,
                                                                                                               handler,
                                                                                                               proxy
                                                                                                           }: SaveEventProps<E, K, Self>): void {
        if (!this._outEvents[(emitter as any)._eId]) {
            this._outEvents[(emitter as any)._eId] = Object.assign(Object.create(null), {
                emitter,
                events: Object.create(null)
            });
        }
        if (!this._outEvents[(emitter as any)._eId].events[event]) {
            this._outEvents[(emitter as any)._eId].events[event] = [];
        }
        this._outEvents[(emitter as any)._eId].events[event].push({ handler, proxy });
    }

    private static count = 0;

    private static makeId(): string {
        return `E${EventEmitter.count++}-${Math.floor(EventEmitter.count / 2)}`;
    }
}

type EventData<T, SELF> = {
    once: boolean;
    context: SELF;
    handler: EventEmitter.Handler<T, SELF>;
}

type TOrEmpty<T> = T | null | undefined;

export namespace EventEmitter {

    export interface Handler<T, SELF> {
        (this: SELF, data: T): any;
    }
}

type EventDataStorage<T extends Record<string, any>> = {
    [Key in keyof T]: Array<EventData<T[Key], any>>;
}

type OutEventStorage = {
    [Key: string]: OutEventStorageItem<any>;
}

type OutEventStorageItem<E extends EventEmitter<any>> = {
    emitter: E;
    events: Record<keyof EmitterEvents<E>, Array<OutStorageItem<E>>>;
}

type OutStorageItem<E extends EventEmitter<any>> = {
    handler: Handler<EmitterEvents<E>[keyof EmitterEvents<E>], any>;
    proxy?: Handler<EmitterEvents<E>[keyof EmitterEvents<E>], any>;
}

type SaveEventProps<E extends ListenEmitter<any>, K extends keyof EmitterEvents<E>, Self = undefined> = {
    event: K;
    handler: Handler<EmitterEvents<E>[K], Self>;
    proxy?: Handler<EmitterEvents<E>[K], Self>;
    emitter: E;
}

type ListenEmitter<E extends EventEmitter<any>> = Pick<E, 'on' | 'off' | 'once'>;

type EmitterEvents<E extends ListenEmitter<any>> = E extends Pick<EventEmitter<infer R>, 'on' | 'off' | 'once'> ? R : never;
