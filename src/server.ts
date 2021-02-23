import * as WebSocket from 'ws';

interface Room {
    users: User[];
    banned: string[];
}

interface User {
    id: string;
    _id: string;
    name: string;
}

class Server {
    rooms: Room[];
    server: WebSocket.Server;

    constructor() {
        this.rooms = [] as Room[];
        this.server = new WebSocket.Server()
    }
}

const server = new Server();