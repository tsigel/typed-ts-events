import { EventEmitter } from '../src';

type Schema = [
    ['test-number', number],
    ['test-string', string],
    ['test-object', { test: string }],
    ['test-void', void]
]

describe('Event Emitter', () => {

    class TestEmitter extends EventEmitter<EventEmitter.SchemaToEvents<Schema>> {
        public trigger<K extends keyof EventEmitter.SchemaToEvents<Schema>>(event: K, prop: EventEmitter.SchemaToEvents<Schema>[K]): this {
            return super.trigger(event, prop);
        }
    }

    let emitter: TestEmitter;
    let emitter2: TestEmitter;

    beforeEach(() => {
        emitter = new TestEmitter;
        emitter2 = new TestEmitter;
    });

    it('Create', () => {
        new EventEmitter();
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

    it('event with exception', () => {
        let count = 0;
        const handler1 = () => {
            throw new Error('Some error!');
        };
        const handler2 = () => {
            count++;
        };
        emitter.on('test-void', handler1);
        emitter.on('test-void', handler2);
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

    });

    describe('Listen to', () => {

        it('subscribe', () => {
            let count = 0;
            emitter.listenTo(emitter2, 'test-number', (to_add: number) => {
                count = count + to_add;
            });

            emitter2.trigger('test-number', 1);
            emitter2.trigger('test-number', 1);

            expect(count).toBe(2);
        });

        it('subscribe once', () => {
            let count = 0;
            emitter.listenToOnce(emitter2, 'test-number', (to_add: number) => {
                count = count + to_add;
            });

            emitter2.trigger('test-number', 1);
            emitter2.trigger('test-number', 1);

            expect(count).toBe(1);
        });

        describe('Stop listen', () => {
            it('Stop listen one handler', () => {
                let count = 0;
                const handler = (to_add: number) => {
                    count = count + to_add;
                };
                emitter.listenToOnce(emitter2, 'test-number', handler);
                emitter.listenTo(emitter2, 'test-number', (num) => {
                    count = count + num / 2;
                });
                emitter.stopListenTo(emitter2, 'test-number', handler);
                emitter2.trigger('test-number', 1);
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
                emitter.listenTo(emitter2, 'test-number', handler_num);
                emitter.listenTo(emitter2, 'test-void', handler_void);

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

                emitter.stopListenTo(emitter2, 'test-number');
                emitter.stopListenTo(emitter2, 'test-object');

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

                expect(count).toBe(3);
            });

            it('Stop listen by emitter', () => {
                let count = 0;
                const handler_void = () => {
                    count++;
                };
                emitter.listenTo(emitter2, 'test-number', (num) => {
                    count = count + num;
                });
                emitter.listenTo(emitter2, 'test-void', handler_void);

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

                emitter.stopListenTo(emitter2);

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

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
                emitter.listenTo(emitter2, 'test-number', handler_num);
                emitter.listenTo(emitter2, 'test-void', handler_void);

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

                emitter.stopListenTo(emitter);

                emitter2.trigger('test-number', 1);
                emitter2.trigger('test-void', void 0);

                expect(count).toBe(4);
            });
        });


    });
});
