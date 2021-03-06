import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';

import Room from './Room';
import Socket from './Socket';
import User from './User';

export default class Server extends WebSocket.Server {
    participants: Map<string, User> = new Map<string, User>();
    rooms: Map<string, Room> = new Map<string, Room>();
    sockets: Set<Socket> = new Set<Socket>();

    constructor(port: number = 8443) {
        super({ port });
        console.log(`Server started on port ${port}`);

        this.bindEventListeners();
        setInterval(() => {
            this.sockets.forEach(s => {
                if (s.isAlive == false) return s.ws.terminate();
                s.isAlive = false;
                s.ping(() => { });
            });
        }, 30000);
    }

    bindEventListeners() {
        this.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            this.sockets.add(new Socket(this, ws, req));
        });
    }

    broadcast(item: object, ignore?: string[]) {
        this.sockets.forEach(s => {
            if (ignore?.includes(s._id)) return;
            if (Array.isArray(item)) return s.sendArray(item);
            else return s.sendObject(item);
        });
    }

    broadcastTo(item: object, ppl: string | any[], ignore?: string[]) {
        this.sockets.forEach(s => {
            if (!ppl.includes(s._id) || ignore?.includes(s._id)) return;
            if (Array.isArray(item)) return s.sendArray(item);
            else return s.sendObject(item);
        });
    }
    // EVENT TIME!
    handleData(s: Socket, data: any) {
        if (Array.isArray(data) || !data.hasOwnProperty('m')) return;
        if (!['t', 'm', 'n', 'userset'].includes(data.m)) console.log(data);
        if (data.m == 'hi') {
            const p = this.newParticipant(s);
            return s.sendObject({
                m: 'hi',
                u: p.generateJSON(),
                t: Date.now()
            });
        }
        if (data.m == 'ch') {
            const p = this.getParticipant(s);
            if (!p) return;
            // Old Room
            const old = this.getRoom(p.room);
            if (old) {
                old.removeParticipant(p._id);
                if (old.count <= 0) this.rooms.delete(p.room);
            }
            // New Room
            let r = this.getRoom(data._id);
            if (!r) r = this.newRoom(data, p);

            let pR = r.findParticipant(p._id);
            if (!pR) pR = r.newParticipant(p);

            p.room = r._id;
            console.log(pR);
            if (!r.settings.lobby && pR) {
                r.crown = {
                    id: pR.id,
                    _id: p._id,
                    time: new Date()
                };
                this.rooms.set(r._id, r);
            }
            // Clear Chat
            s.sendObject({
                m: 'c'
            }, () => {
                const chatobjs = [];
                for (let i = 0; i < (r.chat.messages.length > 50 ? 50 : r.chat.messages.length); i++) {
                    chatobjs.unshift(r.chat.messages[i]);
                }
                return s.sendArray(chatobjs);
            });
            return s.sendObject({
                m: 'ch',
                ch: r.generateJSON(),
                p: r.findParticipant(p._id).id,
                ppl: r.ppl.length > 0 ? r.ppl : null
            });
        }
        if (data.m == 'chset') {
            const p = this.getParticipant(s);
            if (!p) return;
            const r = this.getRoom(p.room);
            if (!r) return;
            if (r.crown && r.crown.id != p._id) return;
            r.update(data.set);
        }
        if (data.m == 'a') {
            const p = this.getParticipant(s);
            if (!p) return;
            const r = this.getRoom(p.room);
            if (!r) return;
            const pR = r.findParticipant(p._id);
            if (!data.message) return;
            if (data.message.length > 255) {
                data.message.length = 255;
            }
            data.message = data.message.replace(/\r?\n|\r/g, '');
            const msg = {
                m: 'a',
                p: pR.generateJSON(),
                a: data.message
            };
            r.chat.add(msg);
            return this.broadcastTo(msg, r.ppl.map(tpR => tpR._id));
        }
        if (data.m == 'n') {
            const p = this.getParticipant(s);
            if (!p) return;
            const r = this.getRoom(p.room);
            if (!r) return;
            const pR = r.findParticipant(p._id);
            if (!pR) return;
            return this.broadcastTo({
                m: 'n',
                n: data.n,
                p: pR.id,
                t: data.t
            }, r.ppl.map(tpR => tpR._id), [p._id]);
        }
        if (data.m == 'm') {
            const p = this.getParticipant(s);
            if (!p) return;
            const r = this.getRoom(p.room);
            if (!r) return;
            const pR = r.findParticipant(p._id);
            if (!pR) return;
            return this.broadcastTo({
                m: 'm',
                id: pR.id,
                x: data.x,
                y: data.y
            }, r.ppl.map(tpR => tpR._id), [p._id]);
        }
        if (data.m == '+ls') {
            const p = this.getParticipant(s);
            if (!p) return;
            p.updates = true;
            const keys: any[] = [];
            this.rooms.forEach(r => {
                if (r.settings.visible) keys.push(r.generateJSON());
            });
            return s.sendObject({
                m: 'ls',
                c: true,
                u: keys
            });
        }
        if (data.m == '-ls') {
            // ...
        }
        if (data.m == 'userset') {
            const p = this.getParticipant(s);
            if (!p) return;
            if (data.set.name && data.set.name.length > 250) {
                data.set.name = 'Invalid';
            }
            p.updateUser(data.set.name);
            const r = this.getRoom(p.room);
            if (!r) return;
            const pR = r.findParticipant(p._id);
            if (!pR) return;
            pR.updateUser(data.set.name || 'Anonymous');
            return this.broadcastTo({
                m: 'p',
                color: p.color,
                id: pR.id,
                name: p.name,
                _id: p._id
            }, r.ppl.map(tpR => tpR._id));
        }
        if (data.m == 't') {
            return s.sendObject({
                m: 't',
                t: Date.now(),
                echo: data.e - Date.now()
            });
        }
    }
    // Participants
    newParticipant(s: Socket) {
        const p = new User(s._id, 'Anonymous',
            `#${Math.floor(Math.random() * 16777215).toString(16)}`);
        this.participants.set(s._id, p);
        return p;
    }
    getParticipant(s: Socket) {
        return this.participants.get(s._id);
    }
    // Rooms
    newRoom(data: any, p: User) {
        const room = new Room(p, this, data._id, 0, data.set);
        this.rooms.set(room._id, room);
        return room;
    }
    getRoom(id: string) {
        return this.rooms.get(id)!;
    }
}