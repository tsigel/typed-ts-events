# Typed Events v1.0.0     

Библиотека для работы с типизированными событиями в TypeScript и javascript.

---

### Установка

```bash
npm i typed-ts-events --save
```

## EventEmitter

### on

+ eventName - наименование события на которе подписываемся
+ handler - обработчик события

Подписываемся на событие. 

```typescript
import { EventEmitter } from 'typed-events';


const emitter = new EventEmitter<{test: number}>();

emitter.on('test', (data: number) => {
    ...
});

```

### once

Идентичен `on` но после первого вызова события автоматически отпишется.

### off
Позволяет отписаться от событий.

Параметры:
+ [eventName] - имя события. Если не передано отпишется от всех событий с переданным `handler`.  
+ [handler] - обработчик событий. Если не передан - отпишется от всех обработчиков с данным `eventName`.

Если параметры не переданы - отпишется от всех событий.

Пример:
```typescript
   emitter.off('some-event', handler); // Отпишется от `some-event` с обработчиком `handler`
   emitter.off('some-event'); // Отпишется от всех обработчиков на имя `some-event`
   emitter.off(null, handler); // Отпишется во всех именах от обработчика `handler`
   emitter.off(handler); // Отпишется во всех именах от обработчика `handler`
   emitter.off(); // Отпишется от всех событий
```
