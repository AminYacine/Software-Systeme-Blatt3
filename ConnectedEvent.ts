import {CanvasRoom} from "./CanvasRoom.js";

export class ConnectedEvent {
    constructor(public clientId: number, public openRooms: CanvasRoom[]) {
    }
}