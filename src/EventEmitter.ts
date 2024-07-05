export class EventEmitter<T extends Record<string, any>> implements IEventEmitter<T> {

    protected readonly _eId: string;
    private readonly _listenAll: Array<{
        context: any,
        handler: <K extends keyof T>(event: K, value: T[K]) => void
    }> = [];
    private readonly _events: EventDataStorage<T> = Object.create(null);
    private readonly _outEvents: OutEventStorage = Object.create(null);

    constructor() {
        this._eId = EventEmitter.makeId();
    }

    // public listenTo<K extends string, E extends IEventEmitter<Record<K, any>>, Self = undefined>(emitter: E, event: K, handler: Handler<EmitterEvents<E>[K], Self>, self?: Self): this {
    public listenTo<K extends string, E extends IEventEmitter<Record<K, any>>, Self = undefined>(emitter: E, event: K, handler: Handler<EmitterEvents<E>[K], Self>, self?: Self) {
        this._saveOutEvent({
            event, handler, emitter
        });
        emitter.on(event, handler, self);
        return () => {
            this.stopListenTo(emitter, event, handler);
        };
    }

    public listenToOnce<K extends string, E extends IEventEmitter<Record<K, any>>, Self = undefined>(emitter: E, event: K, handler: Handler<EmitterEvents<E>[K], Self>, self?: Self) {
        const context = this;
        const proxy: Handler<EmitterEvents<E>[K], Self> = function (data) {
            handler.call(this, data);
            context.stopListenTo(emitter, event, handler);
        };
        this._saveOutEvent({ event, handler, emitter, proxy });
        emitter.once(event, proxy, self);

        return () => {
            this.stopListenTo(emitter, event, handler);
        };
    }

    public stopListenTo<E extends IEventEmitter<{}>>(emitter: E): this
    public stopListenTo<K extends string, E extends IEventEmitter<Record<K, any>>>(emitter: E, event: K): this
    public stopListenTo<K extends string, E extends IEventEmitter<Record<K, any>>>(emitter: E, event: K, handler: Handler<EmitterEvents<E>[K], any>): this
    public stopListenTo<K extends string, E extends IEventEmitter<Record<K, any>>>(emitter: E, event?: K, handler?: Handler<EmitterEvents<E>[K], any>): this {
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

    public listenAll(handler: <K extends keyof T>(event: K, value: T[K]) => void): this
    public listenAll<Self>(handler: <K extends keyof T>(this: Self, event: K, value: T[K]) => void, context?: Self): this
    public listenAll(handler: <K extends keyof T>(event: K, value: T[K]) => void, context?: any): this {
        this._listenAll.push({ context: context, handler });
        return this;
    }

    public stopListenAll(handler?: <K extends keyof T>(event: K, value: T[K]) => void): this {
        if (!handler) {
            this._listenAll.splice(0, this._listenAll.length);
            return this;
        }
        for (let i = this._listenAll.length - 1; i >= 0; i--) {
            if (this._listenAll[i].handler === handler) {
                this._listenAll.splice(i, 1);
            }
        }
        return this;
    }

    public on<K extends keyof T, SELF = undefined>(eventName: K, handler: Handler<T[K], SELF>, context?: SELF) {
        return this._on(eventName, handler, context, false);
    }


    public once<K extends keyof T, SELF = undefined>(eventName: K, handler: Handler<T[K], SELF>, context?: SELF) {
        return this._on(eventName, handler, context, true);
    }

    public off(): this
    public off(eventName: keyof T): this
    public off(handler: Handler<T[keyof T], any>): this
    public off(eventName: TOrEmpty<keyof T>, handler: TOrEmpty<Handler<T[keyof T], any>>): this
    public off<K extends keyof T>(eventName: K, handler: TOrEmpty<Handler<T[K], any>>): this
    public off<K extends keyof T>(arg1?: any, arg2?: any): this {
        const eventName: TOrEmpty<keyof T> = typeof arg1 === 'string' ? arg1 : null;
        const handler: TOrEmpty<Handler<T[keyof T], any>> = typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : null;

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

    protected trigger<K extends keyof T>(eventName: K, params: T[K]): this {
        this._listenAll.forEach((data) => {
            data.handler.call(data.context, eventName, params);
        });

        if (!this._events[eventName]) {
            return this;
        }

        this._events[eventName].slice().forEach(data => {
            data.handler.call(data.context, params);
            if (data.once) {
                this.off(eventName, data.handler);
            }
        });

        if (!this._events[eventName].length) {
            delete this._events[eventName];
        }

        return this;
    }

    private _on<K extends keyof T, SELF = undefined>(eventName: K, handler: Handler<T[K], SELF>, context: SELF | undefined, once: boolean) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }

        this._events[eventName].push({ handler, context, once });

        return () => {
            this.off(eventName, handler);
        };
    }

    private _saveOutEvent<K extends string, E extends IEventEmitter<Record<K, any>>, Self = undefined>({
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
    handler: Handler<T, SELF>;
}

type TOrEmpty<T> = T | null | undefined;


export interface Handler<T, SELF> {
    (this: SELF, data: T): any;
}

type Pairs<T extends Array<[string, any]>> = Extract<{
    [Index in keyof T]: T[Index] extends [string, any] ? T[Index] : never
}[keyof T], [string, any]>;

type FilterTuple<K extends string, Schema extends Array<[string, any]>> = Extract<Pairs<Schema>, [K, any]>;

export type SchemaToEvents<T extends Array<[string, any]>> = {
    [Key in Pairs<T>[0]]: FilterTuple<Key, T>[1]
};

type EventDataStorage<T extends Record<string, any>> = {
    [Key in keyof T]: Array<EventData<T[Key], any>>;
}

type OutEventStorage = {
    [Key: string]: OutEventStorageItem<any>;
}

type OutEventStorageItem<E extends IEventEmitter<{}>> = {
    emitter: E;
    events: Record<keyof EmitterEvents<E>, Array<OutStorageItem<E>>>;
}

type OutStorageItem<E extends IEventEmitter<{}>> = {
    handler: Handler<EmitterEvents<E>[keyof EmitterEvents<E>], any>;
    proxy?: Handler<EmitterEvents<E>[keyof EmitterEvents<E>], any>;
}

type SaveEventProps<E extends IEventEmitter<{}>, K extends keyof EmitterEvents<E>, Self = undefined> = {
    event: K;
    handler: Handler<EmitterEvents<E>[K], Self>;
    proxy?: Handler<EmitterEvents<E>[K], Self>;
    emitter: E;
}

type EmitterEvents<E> = E extends EventEmitter<infer R> ? R : never;

export interface IEventEmitter<T extends Record<string, any>> {
    on<K extends keyof T, Context = undefined>(event: K, handler: Handler<T[K], Context>, self?: Context): () => void;

    once<K extends keyof T, Context = undefined>(event: K, handler: Handler<T[K], Context>, self?: Context): () => void;

    off<K extends keyof T>(event: K, handler: Handler<T[K], any>): this;

    off<K extends keyof T>(event: K): this;

    off(event: null | undefined, handler: Handler<any, any>): this;

    off(): this;
}
