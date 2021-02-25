"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoomUser {
    constructor(id, name, color, _id) {
        this.id = id;
        this.name = name;
        this.color = color;
        this._id = _id;
    }
    updateUser(name, color) {
        this.name = name || this.name;
        this.color = color || this.color;
    }
    generateJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            _id: this._id
        };
    }
}
exports.default = RoomUser;
