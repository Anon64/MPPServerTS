import * as fs from 'fs'; //temporary until we can get mongodb working

//ill probably move the database thing to its own file

export default class User {
    _id: string;
    name: string;
    color: string;
    room: string = "";
    updates: boolean = false;

    constructor(_id: string, name: string, color: string) {
        this._id = _id;
        this.name = name;
        this.color = color;

        const udb = this.requestFile();
        if (!udb) return;
        if (udb[this._id]) {
            this.name = udb[this._id].name;
            this.color = udb[this._id].color;
        } else {
            udb[this._id] = this.generateJSON();
            this.updateFile(udb);
        }
    }

    requestFile() {
        try {
            return JSON.parse(fs.readFileSync('./database/users.json', 'utf-8'));
        } catch (e) {
            console.error('Error retrieving file', e);
            return null;
        }
    }

    updateFile(json: string) {
        try {
            return JSON.parse(fs.readFileSync('./database/users.json', 'utf-8'));
        } catch (e) {
            console.error('Error writing file', e);
            return null;
        }
    }

    updateUser(name: string, color?: string): void {
        const udb = this.requestFile();
        if (!udb) return;
        this.name = name || this.name;
        this.color = color || this.color;
        udb[this._id] = this.generateJSON();
        this.updateFile(udb);
    }

    generateJSON() {
        return {
            _id: this._id,
            name: this.name,
            color: this.color
        };
    }
}