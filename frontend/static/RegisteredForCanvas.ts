import {CanvasEvent} from "./Event.js";

export class RegisteredForCanvas  {
    constructor(public canvasId: number, public eventsForCanvas: CanvasEvent[]) {
    }

}