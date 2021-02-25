import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';

interface Room {
    users: User[];
    chat: ChatMessage[]
    banned: string[];
}

interface User {
    id: string;
    _id: string;
    name: string;
}

interface ChatMessage {
    _id: string;
    message: string;
    color: string;
}

class Server {
    rooms: Room[];
    server: WebSocket.Server;

    constructor(port: number = 8443) {
        this.rooms = [] as Room[];
        this.server = new WebSocket.Server({ port });

        console.log(`Server started on port ${port}`);

        this.server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            console.log(`Attempted connection from: ${req.socket.remoteAddress}`);
            ws.send(`[{"m":"hi"}]`);
            ws.on("message", message => {
                let messageArray = JSON.parse(message.toString());
                console.log(messageArray);
            });
        });
    }
}

const server = new Server();