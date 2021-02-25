"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const Room_1 = require("./Room");
const Socket_1 = __importDefault(require("./Socket"));
const User_1 = __importDefault(require("./User"));
class Server extends WebSocket.Server {
    constructor(port = 8443) {
        super({ port });
        this.participants = new Map();
        this.rooms = new Map();
        this.sockets = new Set();
        console.log(`Server started on port ${port}`);
        this.bindEventListeners();
        setInterval(() => {
            this.sockets.forEach(s => {
                if (s.isAlive == false)
                    return s.ws.terminate();
                s.isAlive = false;
                s.ping(() => { });
            });
        }, 30000);
    }
    bindEventListeners() {
        this.on('connection', (ws, req) => {
            this.sockets.add(new Socket_1.default(this, ws, req));
        });
    }
    broadcast(item, ignore) {
        this.sockets.forEach(s => {
            if (ignore === null || ignore === void 0 ? void 0 : ignore.includes(s._id))
                return;
            if (Array.isArray(item))
                return s.sendArray(item);
            else
                return s.sendObject(item);
        });
    }
    broadcastTo(item, ppl, ignore) {
        this.sockets.forEach(s => {
            if (!ppl.includes(s._id) || (ignore === null || ignore === void 0 ? void 0 : ignore.includes(s._id)))
                return;
            if (Array.isArray(item))
                return s.sendArray(item);
            else
                return s.sendObject(item);
        });
    }
    // EVENT TIME!
    handleData(s, data) {
        if (Array.isArray(data) || !data.hasOwnProperty('m'))
            return;
        if (!['t', 'm', 'n', 'userset'].includes(data.m))
            console.log(data);
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
            if (!p)
                return;
            // Old Room
            const old = this.getRoom(p.room);
            if (old) {
                old.removeParticipant(p._id);
                if (old.count <= 0)
                    this.rooms.delete(p.room);
            }
            // New Room
            let r = this.getRoom(data._id);
            if (!r)
                r = this.newRoom(data, p);
            let pR = r.findParticipant(p._id);
            if (!pR)
                pR = r.newParticipant(p);
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
            if (!p)
                return;
            const r = this.getRoom(p.room);
            if (!r)
                return;
            if (r.crown && r.crown.id != p._id)
                return;
            r.update(data.set);
        }
        if (data.m == 'a') {
            const p = this.getParticipant(s);
            if (!p)
                return;
            const r = this.getRoom(p.room);
            if (!r)
                return;
            const pR = r.findParticipant(p._id);
            if (!data.message)
                return;
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
            if (!p)
                return;
            const r = this.getRoom(p.room);
            if (!r)
                return;
            const pR = r.findParticipant(p._id);
            if (!pR)
                return;
            return this.broadcastTo({
                m: 'n',
                n: data.n,
                p: pR.id,
                t: data.t
            }, r.ppl.map(tpR => tpR._id), [p._id]);
        }
        if (data.m == 'm') {
            const p = this.getParticipant(s);
            if (!p)
                return;
            const r = this.getRoom(p.room);
            if (!r)
                return;
            const pR = r.findParticipant(p._id);
            if (!pR)
                return;
            return this.broadcastTo({
                m: 'm',
                id: pR.id,
                x: data.x,
                y: data.y
            }, r.ppl.map(tpR => tpR._id), [p._id]);
        }
        if (data.m == '+ls') {
            const p = this.getParticipant(s);
            if (!p)
                return;
            p.updates = true;
            const keys = [];
            this.rooms.forEach(r => {
                if (r.settings.visible)
                    keys.push(r.generateJSON());
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
            if (!p)
                return;
            if (data.set.name && data.set.name.length > 250) {
                data.set.name = 'Invalid';
            }
            p.updateUser(data.set.name);
            const r = this.getRoom(p.room);
            if (!r)
                return;
            const pR = r.findParticipant(p._id);
            if (!pR)
                return;
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
    newParticipant(s) {
        const p = new User_1.default(s._id, 'Anonymous', `#${Math.floor(Math.random() * 16777215).toString(16)}`);
        this.participants.set(s._id, p);
        return p;
    }
    getParticipant(s) {
        return this.participants.get(s._id);
    }
    // Rooms
    newRoom(data, p) {
        const room = new Room_1.Room(p, this, data._id, 0, data.set);
        this.rooms.set(room._id, room);
        return room;
    }
    getRoom(id) {
        return this.rooms.get(id);
    }
}
exports.default = Server;
