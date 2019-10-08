"use strict";
exports.__esModule = true;
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this._events = Object.create(null);
    }
    EventEmitter.prototype.hasListeners = function (eventName) {
        return !!(this._events[eventName] && this._events[eventName].length);
    };
    EventEmitter.prototype.getActiveEvents = function () {
        var _this = this;
        return Object.keys(this._events).filter(function (name) { return _this.hasListeners(name); });
    };
    EventEmitter.prototype.trigger = function (eventName, params) {
        if (this._events[eventName]) {
            this._events[eventName] = this._events[eventName].filter(function (data) {
                try {
                    data.handler.call(data.context, params);
                }
                catch (e) {
                }
                return !data.once;
            });
            if (!this._events[eventName].length) {
                delete this._events[eventName];
            }
        }
    };
    EventEmitter.prototype.on = function (eventName, handler, context) {
        this._on(eventName, handler, context, false);
    };
    EventEmitter.prototype.once = function (eventName, handler, context) {
        this._on(eventName, handler, context, true);
    };
    EventEmitter.prototype.off = function (arg1, arg2) {
        var _this = this;
        var eventName = typeof arg1 === 'string' ? arg1 : null;
        var handler = typeof arg2 === 'function' ? arg2 : typeof arg1 === 'function' ? arg1 : null;
        if (!eventName) {
            Object.keys(this._events).forEach(function (eventName) {
                _this.off(eventName, handler);
            });
            return void 0;
        }
        if (!handler) {
            delete this._events[eventName];
            return void 0;
        }
        if (eventName in this._events) {
            this._events[eventName] = this._events[eventName].filter(function (item) { return item.handler !== handler; });
        }
    };
    EventEmitter.prototype._on = function (eventName, handler, context, once) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push({ handler: handler, context: context, once: once });
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
