import Server from './Server';
import Chat from './Chat';
import RoomUser from './RoomUser';
import User from './User';

import sha1 from 'sha1';

const defaultColor = '#3b5054';
const defaultColor2 = '#3b5054'; //idk color 2 yet

//https://github.com/Charsy89/mpp-protocol

interface RoomSettings {
    visible: boolean;
    chat: boolean;
    crownsolo: boolean;
    lobby: boolean;
    color: string;
    color2?: string;
}

interface vec2 {
    x: number;
    y: number;
}

interface Crown {
    _id?: string;
    id?: string;
    time?: Date;
    startPos?: vec2;
    endPos?: vec2;
}

export default class Room {
    server: Server;
    count: number;
    _id: string; //name of room
    settings: RoomSettings;

    crown: Crown = {} as Crown;
    ppl: RoomUser[] = [] as RoomUser[];
    chat: Chat = new Chat();

    constructor(p: User, server: Server, _id: string, count: number, settings: RoomSettings) {
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
        } else {
            this.settings = {
                chat: settings.chat != null ? settings.chat : true,
                color: settings.color || defaultColor,
                crownsolo: settings.crownsolo != null ? settings.crownsolo : false,
                lobby: false,
                visible: settings.visible != null ? settings.visible : true
            };
        }
    }

    newParticipant(p: User): RoomUser {
        this.count++;
        const pR = new RoomUser(
            sha1(Date.now().toString()).substring(0, 20),
            p.name, p.color, p._id
        );
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

    findParticipant(_id: string): RoomUser {
        return this.ppl.find(p => p._id == _id)!;
    }

    removeParticipant(_id: string): void {
        const pR = this.findParticipant(_id);
        if (!pR) return;
        this.count--;
        this.ppl = this.ppl.filter(p => p._id != _id);
        this.server.broadcastTo({
            m: 'bye',
            p: pR.id
        }, this.ppl.map(tpR => tpR._id));
    }

    update(settings = {} as RoomSettings) {
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
            Object.assign(obj, { crown: this.crown })
        }
        return obj;
    }

}