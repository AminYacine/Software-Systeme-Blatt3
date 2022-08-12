import {CanvasEvent} from "./Event.js";

export class RegisteredForCanvasEvent {
    constructor(public canvasId: number, public eventsForCanvas: CanvasEvent[]) {
    }

}