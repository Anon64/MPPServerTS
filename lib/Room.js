"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const Chat_1 = __importDefault(require("./Chat"));
const RoomUser_1 = __importDefault(require("./RoomUser"));
const sha1_1 = __importDefault(require("sha1"));
const defaultColor = '#3b5054';
const defaultColor2 = '#3b5054'; //idk color 2 yet
class Room {
    constructor(p, server, _id, count, settings) {
        this.crown = {};
        this.ppl = [];
        this.chat = new Chat_1.default();
        this.server = server;
        this.count = count;
        this._id = _id;
        const isLobby = this._id.toLowerCase().includes('lobby');
        if (isLobby) {
            this.settings = {
                chat: true,
                color: defaultColor,
                crownsolo: false,
                lobby: true,
                visible: true
            };
        }
        else {
            this.settings = {
                chat: settings.chat != null ? settings.chat : true,
                color: settings.color || defaultColor,
                crownsolo: settings.crownsolo != null ? settings.crownsolo : false,
                lobby: false,
                visible: settings.visible != null ? settings.visible : true
            };
        }
    }
    newParticipant(p) {
        this.count++;
        const pR = new RoomUser_1.default(sha1_1.default(Date.now().toString()).substring(0, 20), p.name, p.color, p._id);
        this.ppl.push(pR);
        this.server.broadcastTo({
            m: 'p',
            color: p.color,
            id: pR.id,
            name: p.name,
            x: 0,
            y: 0,
            _id: p._id
        }, this.ppl.map(tpR => tpR._id), [p._id]);
        return pR;
    }
    findParticipant(_id) {
        return this.ppl.find(p => p._id == _id);
    }
    removeParticipant(_id) {
        const pR = this.findParticipant(_id);
        if (!pR)
            return;
        this.count--;
        this.ppl = this.ppl.filter(p => p._id != _id);
        this.server.broadcastTo({
            m: 'bye',
            p: pR.id
        }, this.ppl.map(tpR => tpR._id));
    }
    update(settings = {}) {
        this.settings = Object.assign(this.settings, {
            chat: settings.chat != null ? settings.chat : this.settings.chat,
            color: settings.color || this.settings.color,
            crownsolo: settings.crownsolo != null ? settings.crownsolo : this.settings.crownsolo,
            visible: settings.visible != null ? settings.visible : this.settings.visible
        });
    }
    generateJSON() {
        let obj = {
            _id: this._id,
            settings: this.settings,
            count: this.count
        };
        if (this.crown) {
            Object.assign(obj, { crown: this.crown });
        }
        return obj;
    }
}
exports.Room = Room;
