import {CanvasEvent} from "./Event.js";

export class RegisteredForCanvasEvent {
    constructor(public canvasId: string, public eventsForCanvas: CanvasEvent[]) {
    }

}