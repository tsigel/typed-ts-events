import { EventEmitter, SchemaToEvents } from '../src';

type Schema = [
    ['test-number', number],
    ['test-string', string],
    ['test-object', { test: string }],
    ['test-void', void]
]

type Schema2 = [
    ['test-number2', number],
    ['test-string2', string],
    ['test-object2', { test: string }],
    ['test-void2', void]
]

describe('Event Emitter', () => {

    class TestEmitter extends EventEmitter<SchemaToEvents<Schema>> {
        public trigger<K extends keyof SchemaToEvents<Schema>>(event: K, prop: SchemaToEvents<Schema>[K]): this {
            return super.trigger(event, prop);
        }
    }

    class TestEmitter2 extends EventEmitter<SchemaToEvents<Schema2>> {
        public trigger<K extends keyof SchemaToEvents<Schema2>>(event: K, prop: SchemaToEvents<Schema2>[K]): this {
            return super.trigger(event, prop);
        }
    }

    let emitter: TestEmitter;
    let emitter2: TestEmitter2;

    beforeEach(() => {
        emitter = new TestEmitter;
        emitter2 = new TestEmitter2;
    });

    it('Create', () => {
        new EventEmitter();
    });

    it('listenAll', () => {
        const events = Object.create(null);
        emitter.listenAll((event) => {
            if (!events[event]) {
                events[event] = 0;
            }
            events[event]++;
        });
        emitter.trigger('test-number', 1);
        emitter.trigger('test-number', 1);
        emitter.trigger('test-object', { test: '123' });

        expect(events).toEqual({ 'test-number': 2, 'test-object': 1 });
    });

    it('stopListenAll', () => {
        const events = Object.create(null);
        const handler = (event: string) => {
            if (!events[event]) {
                events[event] = 0;
            }
            events[event]++;
        };
        emitter.listenAll(handler);
        emitter.trigger('test-number', 1);
        emitter.trigger('test-object', { test: '123' });
        emitter.stopListenAll(handler);
        emitter.trigger('test-number', 1);

        expect(events).toEqual({ 'test-number': 1, 'test-object': 1 });
    });

    it('on', () => {
        let numberOk = false;
        let stringOk = false;
        let objectOk = false;
        let count = 0;

        emitter.on('test-number', data => {
            numberOk = data === 1;
        });

        emitter.on('test-string', data => {
            stringOk = data === '1';
        });

        emitter.on('test-object', data => {
            objectOk = data && data.test === '1';
        });

        emitter.on('test-void', () => {
            count++;
        });

        expect(emitter.hasListeners('test-void')).toBe(true);
        expect(emitter.getActiveEvents().sort()).toEqual(['test-number', 'test-string', 'test-object', 'test-void'].sort());

        emitter.trigger('test-number', 1);
        emitter.trigger('test-string', '1');
        emitter.trigger('test-object', { test: '1' });
        emitter.trigger('test-void', void 0);
        emitter.trigger('test-void', void 0);

        expect(numberOk).toBe(true);
        expect(stringOk).toBe(true);
        expect(objectOk).toBe(true);
        expect(count).toBe(2);
    });

    it('once', () => {
        let count = 0;
        emitter.once('test-void', () => {
            count++;
        });
        expect(emitter.hasListeners('test-void')).toBe(true);
        emitter.trigger('test-void', void 0);
        expect(emitter.hasListeners('test-void')).toBe(false);
        emitter.trigger('test-void', void 0);
        expect(count).toBe(1);
    });

    it('off in trigger', () => {
        let count = 0;
        const handler1 = () => {
            emitter.off('test-void', handler1);
            count++;
        };

        emitter.on('test-void', handler1);

        emitter.trigger('test-void', void 0);
        emitter.trigger('test-void', void 0);

        expect(count).toBe(1);
    });

    it('off all in trigger', () => {
        emitter.on('test-string', () => {
            emitter.off();
        });
        emitter.trigger('test-string', '123');
    });

    describe('off', () => {

        it('Without arguments', () => {
            let count = 0;

            emitter.on('test-number', data => {
                count++;
            });

            emitter.on('test-string', data => {
                count++;
            });

            emitter.on('test-object', data => {
                count++;
            });

            emitter.on('test-void', () => {
                count++;
            });

            expect(emitter.hasListeners('test-void')).toBe(true);
            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            emitter.off();
            expect(emitter.hasListeners('test-void')).toBe(false);

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            expect(count).toBe(4);
        });

        it('Stop listen by event name', () => {
            let count = 0;

            emitter.on('test-number', () => {
                count++;
            });

            emitter.on('test-string', () => {
                count++;
            });

            emitter.on('test-object', () => {
                count++;
            });

            emitter.on('test-void', () => {
                count++;
            });

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            emitter.off('test-number');
            emitter.off('test-string');

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            expect(count).toBe(6);
        });

        it('Stop listen by handler', () => {
            let count = 0;

            const handler1 = () => {
                count++;
            };
            const handler2 = () => {
                count++;
            };

            emitter.off('test-number', handler1);

            emitter.on('test-number', handler1);
            emitter.on('test-string', handler1);
            emitter.on('test-object', handler1);
            emitter.on('test-void', handler1);
            emitter.on('test-number', handler2);
            emitter.on('test-string', handler2);
            emitter.on('test-object', handler2);
            emitter.on('test-void', handler2);

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            emitter.off(handler1);

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            emitter.off(null, handler2);

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            expect(count).toBe(12);
        });

        it('Stop listen by unsubscribe callback', () => {
            let count = 0;
            const unsubscribe = emitter.on('test-number', (n) => {
                count += n;
            });
            emitter.trigger('test-number', 1);
            unsubscribe();
            emitter.trigger('test-number', 1);
            expect(count).toBe(1);
        });

    });

    describe('Listen to', () => {

        it('subscribe', () => {
            let count = 0;

            emitter.listenTo(emitter2, 'test-number2', (to_add) => {
                count = count + to_add;
            });

            emitter2.trigger('test-number2', 1);
            emitter2.trigger('test-number2', 1);

            expect(count).toBe(2);
        });

        it('subscribe once', () => {
            let count = 0;
            emitter.listenToOnce(emitter2, 'test-number2', (to_add) => {
                count = count + to_add;
            });

            emitter2.trigger('test-number2', 1);
            emitter2.trigger('test-number2', 1);

            expect(count).toBe(1);
        });

        describe('Stop listen', () => {
            it('Stop listen one handler', () => {
                let count = 0;
                const handler = (to_add: number) => {
                    count = count + to_add;
                };
                emitter.listenToOnce(emitter2, 'test-number2', handler);
                emitter.listenTo(emitter2, 'test-number2', (num) => {
                    count = count + num / 2;
                });
                emitter.stopListenTo(emitter2, 'test-number2', handler);
                emitter2.trigger('test-number2', 1);
                expect(count).toBe(0.5);
            });
            it('Stop listen by event', () => {
                let count = 0;
                const handler_num = (to_add: number) => {
                    count = count + to_add;
                };
                const handler_void = () => {
                    count++;
                };
                emitter.listenTo(emitter2, 'test-number2', handler_num);
                emitter.listenTo(emitter2, 'test-void2', handler_void);

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                emitter.stopListenTo(emitter2, 'test-number2');
                emitter.stopListenTo(emitter2, 'test-object2');

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                expect(count).toBe(3);
            });

            it('Stop listen by emitter', () => {
                let count = 0;
                const handler_void = () => {
                    count++;
                };
                emitter.listenTo(emitter2, 'test-number2', (num) => {
                    count = count + num;
                });
                emitter.listenTo(emitter2, 'test-void2', handler_void);

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                emitter.stopListenTo(emitter2);

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                expect(count).toBe(2);
            });

            it('Stop listen by emitter', () => {
                let count = 0;
                const handler_num = (to_add: number) => {
                    count = count + to_add;
                };
                const handler_void = () => {
                    count++;
                };
                emitter.listenTo(emitter2, 'test-number2', handler_num);
                emitter.listenTo(emitter2, 'test-void2', handler_void);

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                emitter.stopListenTo(emitter);

                emitter2.trigger('test-number2', 1);
                emitter2.trigger('test-void2', void 0);

                expect(count).toBe(4);
            });
        });


    });
});
