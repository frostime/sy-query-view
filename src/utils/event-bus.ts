
export class EventBusSync {

    events: { [key: string]: Function[] } = {};

    constructor() { }

    on(eventName: string, callback: Function) {
        if (eventName in this.events) {
            this.events[eventName].push(callback);
        } else {
            this.events[eventName] = [callback];
        }
    }

    off(eventName: string, callback: Function) {
        if (eventName in this.events) {
            let index = this.events[eventName].indexOf(callback);
            if (index >= 0) {
                this.events[eventName].splice(index, 1);
            }
        }
    }

    emit(eventName: string, data: any) {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName].forEach((callback) => callback(data));
    }

    purge() {
        this.events = {};
    }

}

