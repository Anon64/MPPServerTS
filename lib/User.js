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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs")); //temporary until we can get mongodb working
//ill probably move the database thing to its own file
class User {
    constructor(_id, name, color) {
        this.room = "";
        this.updates = false;
        this._id = _id;
        this.name = name;
        this.color = color;
        const udb = this.requestFile();
        if (!udb)
            return;
        if (udb[this._id]) {
            this.name = udb[this._id].name;
            this.color = udb[this._id].color;
        }
        else {
            udb[this._id] = this.generateJSON();
            this.updateFile(udb);
        }
    }
    requestFile() {
        try {
            return JSON.parse(fs.readFileSync('./database/users.json', 'utf-8'));
        }
        catch (e) {
            console.error('Error retrieving file', e);
            return null;
        }
    }
    updateFile(json) {
        try {
            return JSON.parse(fs.readFileSync('./database/users.json', 'utf-8'));
        }
        catch (e) {
            console.error('Error writing file', e);
            return null;
        }
    }
    updateUser(name, color) {
        const udb = this.requestFile();
        if (!udb)
            return;
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
exports.default = User;
