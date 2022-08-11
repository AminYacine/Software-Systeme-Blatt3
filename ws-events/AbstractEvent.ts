import {WsEvents} from "./WsEvents";

export class AbstractEvent {

    constructor(public type: WsEvents, public value: any ) {
    }
}
