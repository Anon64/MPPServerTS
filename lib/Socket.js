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
const events_1 = require("events");
const sha1_1 = __importDefault(require("sha1"));
const WebSocket = __importStar(require("ws"));
class Socket extends events_1.EventEmitter {
    constructor(server, ws, req) {
        super();
        this.server = server;
        this.ws = ws;
        this.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        this._id = sha1_1.default(this.ip).substring(0, 20);
        this.isAlive = true;
        this.bindEvents();
        this.bindEventListeners();
        this.debug('New Socket Constructed');
    }
    bindEvents() {
        const self = this;
        const oldEmit = this.ws.emit;
        this.ws.emit = function onEmit() {
            self.emit(arguments[0], arguments[1]);
            oldEmit.apply(self.ws, arguments);
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
            }
            catch (e) {
                return 'Invalid Request';
            }
            if (!Array.isArray(d))
                return this.server.handleData(this, d);
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
    send(raw, cb) {
        if (this.ws.readyState !== WebSocket.OPEN)
            return;
        this.ws.send(raw, cb);
    }
    sendArray(arr, cb) {
        this.send(JSON.stringify(arr), cb);
    }
    sendObject(obj, cb) {
        this.sendArray([obj], cb);
    }
    debug(args) {
        console.log(`[${this._id.substring(0, 5)}] ${args}`);
    }
    debugErr(args) {
        console.error(`[${this._id.substring(0, 5)}] ${args}`);
    }
    close() {
        this.debug('Connection Closed');
        const p = this.server.participants.get(this._id);
        let sExists = false;
        this.server.sockets.forEach(s => {
            if (s._id == this._id)
                sExists = true;
        });
        if (sExists)
            return;
        if (p) {
            this.server.participants.delete(this._id);
        }
        this.server.rooms.forEach(r => {
            if (r.findParticipant(this._id)) {
                r.removeParticipant(this._id);
            }
        });
    }
    ping(noop) {
        return this.ws.ping(noop);
    }
    // Broken Connections
    heartbeat() {
        this.isAlive = true;
    }
}
exports.default = Socket;
