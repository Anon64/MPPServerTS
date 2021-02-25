interface ChatMessage {
    m: string;
    p: {
        id: string;
        name: string;
        color: string;
        _id: string;
    };
    a: any;
}

export default class Chat {
    messages: ChatMessage[];

    constructor() {
        this.messages = [] as ChatMessage[];
    }

    add(msg: ChatMessage): void {
        this.messages.unshift(msg);
        if (this.messages.length > 500) this.messages.length = 500;
    }
}