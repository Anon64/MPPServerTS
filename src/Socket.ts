import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import sha1 from 'sha1';
import * as WebSocket from 'ws';
import Server from './Server';

export default class Socket extends EventEmitter {
    server: Server;
    ws: WebSocket;
    ip: any; //should do something else with this
    _id: string;
    isAlive: boolean;

    constructor(server: Server, ws: WebSocket, req: IncomingMessage) {
        super();
        this.server = server;
        this.ws = ws;
        this.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        this._id = sha1(this.ip).substring(0, 20);
        this.isAlive = true;
        this.bindEvents();
        this.bindEventListeners();
        this.debug('New Socket Constructed');
    }

    bindEvents() {
        const self = this;
        const oldEmit = this.ws.emit;
        this.ws.emit = <any>function onEmit() {
            self.emit(arguments[0], arguments[1]);
            oldEmit.apply(self.ws, <any>arguments);
        };
    }

    bindEventListeners() {
        this.on('error', e => {
            this.debugErr(e);
            this.close();
        });

        this.on('message', raw => {
            let d;
            try {
                d = JSON.parse(raw);
            } catch (e) {
                return 'Invalid Request';
            }
            if (!Array.isArray(d)) return this.server.handleData(this, d);
            for (let i = 0; i < d.length; i++) {
                this.server.handleData(this, d[i]);
            }
        });
        this.on('pong', () => {
            this.heartbeat();
        });
        this.on('close', () => {
            this.close();
        });
    }

    send(raw: string, cb?: any) {
        if (this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(raw, cb);
    }

    sendArray(arr: any[], cb?: any) {
        this.send(JSON.stringify(arr), cb);
    }

    sendObject(obj: any, cb?: any) {
        this.sendArray([obj], cb);
    }

    debug(args: string) {
        console.log(`[${this._id.substring(0, 5)}] ${args}`);
    }

    debugErr(args: any) {
        console.error(`[${this._id.substring(0, 5)}] ${args}`);
    }

    close() {
        this.debug('Connection Closed');
        const p = this.server.participants.get(this._id);
        let sExists = false;
        this.server.sockets.forEach(s => {
            if (s._id == this._id) sExists = true;
        });
        if (sExists) return;
        if (p) {
            this.server.participants.delete(this._id);
        }
        this.server.rooms.forEach(r => {
            if (r.findParticipant(this._id)) {
                r.removeParticipant(this._id);
            }
        });
    }

    ping(noop: any) {
        return this.ws.ping(noop);
    }
    // Broken Connections
    heartbeat() {
        this.isAlive = true;
    }
}
