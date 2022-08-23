import {WebSocketEvents} from "../enums/WebSocketEvents.js";
import {AbstractEventDTO} from "../dtos/AbstractEventDTO.js";
import {CanvasEvent} from "../models/CanvasEvent.js";
import {RoomEvent} from "../models/RoomEvent.js";
import {getClientId, getCurrentCanvasRoom, ws} from "./WebSocketService.js";
import {GetCanvasEventsDTO} from "../dtos/GetCanvasEventsDTO.js";
import {DeregisterFromCanvasEventDTO} from "../dtos/DeregisterFromCanvasEventDTO.js";
import {CreateCanvasEventDTO} from "../dtos/CreateCanvasEventDTO.js";
import {RegisterForCanvasEventDTO} from "../dtos/RegisterForCanvasEventDTO.js";

export function sendEvent(eventType: WebSocketEvents, value: any ) {
    ws.send(JSON.stringify(
        new AbstractEventDTO(
            eventType,
            value
        )
    ));
}

export function sendCanvasEvent(event: CanvasEvent) {
    sendEvent(
        WebSocketEvents.CanvasEvent,
        new RoomEvent(getClientId(), getCurrentCanvasRoom(), event)
    );
}

export function sendDeregisterFromCanvasEvent() {
    sendEvent(
        WebSocketEvents.DeregisterForCanvas,
        new DeregisterFromCanvasEventDTO(getClientId(), getCurrentCanvasRoom())
    );
}

export function sendGetCanvasEvents() {
    sendEvent(
        WebSocketEvents.GetCanvasEvents,
        new GetCanvasEventsDTO(getCurrentCanvasRoom(), getClientId())
    );
}

export function sendCreateCanvasEvent(canvasName: string) {
    sendEvent(
        WebSocketEvents.CreateCanvas,
        new CreateCanvasEventDTO(canvasName, getClientId())
    );
}

export function sendRegisterForCanvasEvent(canvasId: string) {
    sendEvent(
        WebSocketEvents.RegisterForCanvas,
        new RegisterForCanvasEventDTO(getClientId(), canvasId)
    );
}