/**
 * Counter utility for tracking requests and bytes sent
 */
export class Counter {
    constructor(value = 0) {
        this.value = value;
    }

    add(amount) {
        this.value += amount;
        return this;
    }

    set(value) {
        this.value = value;
        return this;
    }

    get() {
        return this.value;
    }

    reset() {
        this.value = 0;
        return this;
    }
}

export const REQUESTS_SENT = new Counter();
export const BYTES_SENT = new Counter();
