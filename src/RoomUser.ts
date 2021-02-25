export default class RoomUser {
    id: string;
    name: string;
    color: string;
    _id: string;

    constructor(id: string, name: string, color: string, _id: string) {
        this.id = id;
        this.name = name;
        this.color = color;
        this._id = _id;
    }

    updateUser(name: string, color?: string) {
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
