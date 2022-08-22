import {CanvasRoom} from "../models/CanvasRoom.js";

export class ConnectedEventDTO {
    constructor(public clientId: number, public openRooms: CanvasRoom[]) {
    }
}