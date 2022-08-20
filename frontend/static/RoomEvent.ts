import {CanvasEvent} from "./Event.js";

export class RoomEvent {
    constructor(public clientId: number, public roomId: string, public canvasEvent: CanvasEvent) {
    }
}