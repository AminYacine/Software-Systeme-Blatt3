import {WebSocketEvents} from "../frontend/static/WebSocketEvents.js";

export class AbstractEvent {

    constructor(public type: WebSocketEvents, public value: any ) {
    }
}
