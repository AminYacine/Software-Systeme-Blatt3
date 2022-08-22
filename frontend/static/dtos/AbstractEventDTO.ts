import {WebSocketEvents} from "../enums/WebSocketEvents.js";

export class AbstractEventDTO {
    constructor(public type: WebSocketEvents, public value: any) {
    }
}