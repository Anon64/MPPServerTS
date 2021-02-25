"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Chat {
    constructor() {
        this.messages = [];
    }
    add(msg) {
        this.messages.unshift(msg);
        if (this.messages.length > 500)
            this.messages.length = 500;
    }
}
exports.default = Chat;
