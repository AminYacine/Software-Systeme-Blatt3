import {CanvasEvent} from "../frontend/static/Event.js";

export class RegisteredForCanvas  {
    constructor(public canvasId: number, public eventsForCanvas: CanvasEvent[]) {
    }

}