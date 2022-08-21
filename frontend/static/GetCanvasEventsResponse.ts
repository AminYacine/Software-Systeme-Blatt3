import {RoomEvent} from "./RoomEvent";

export class GetCanvasEventsResponse {
    constructor(public canvasId: string, public events: RoomEvent[], public blockedShapes: any) {
    }

}