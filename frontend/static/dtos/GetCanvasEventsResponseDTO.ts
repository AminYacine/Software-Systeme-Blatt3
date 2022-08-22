import {RoomEvent} from "../models/RoomEvent";

export class GetCanvasEventsResponseDTO {
    constructor(public canvasId: string, public events: RoomEvent[], public blockedShapes: any) {
    }

}