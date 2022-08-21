import {RoomEvent} from "./RoomEvent";

export class CanvasEvents {
    constructor(public canvasId: string, public events: RoomEvent[]) {
    }

}