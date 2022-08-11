import {WebSocketEvents} from "./WebSocketEvents.js";

export class AbstractEvent {
    constructor(public type: WebSocketEvents, public value: any) {
    }
}