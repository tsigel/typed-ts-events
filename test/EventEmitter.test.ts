import { EventEmitter } from '../src';

interface ITestEventsModel {
    'test-number': number;
    'test-string': string;
    'test-object': { test: string };
    'test-void': void;
}

describe('Event Emitter', () => {

    let emitter: EventEmitter<ITestEventsModel>;

    beforeEach(() => {
        emitter = new EventEmitter<ITestEventsModel>();
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
        emitter.trigger('test-void', void 0);
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

            emitter.trigger('test-number', 1);
            emitter.trigger('test-string', '1');
            emitter.trigger('test-object', { test: '1' });
            emitter.trigger('test-void', void 0);

            emitter.off();

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

});
