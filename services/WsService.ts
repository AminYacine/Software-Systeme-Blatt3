import * as WebSocket from "ws";
import {CanvasRoom} from "./CanvasRoom.js";
import {AbstractEvent} from "../ws-events/AbstractEvent.js";
import {WsEvents} from "../ws-events/WsEvents.js";
import {RegisteredForCanvas} from "../ws-events/RegisteredForCanvas.js";
import {CanvasCreatedEvent} from "../ws-events/CanvasCreatedEvent.js";

export class WsService {
    private clientIdCounter = 0;
    private clients: Map<number, WebSocket> = new Map<number, WebSocket>();
    private canvasRooms: Map<number, CanvasRoom> = new Map<number, CanvasRoom>();

    constructor() {
    }

    addClient(ws: WebSocket.WebSocket): number {
        const newId = this.getNewClientID();
        this.clients.set(newId, ws);
        return newId;
    }

    private getNewClientID() {
        return this.clientIdCounter++;
    }

    handleMessage(message: string, client: WebSocket.WebSocket) {
        const event: AbstractEvent = JSON.parse(message);
        console.log("received message: ", event);

        switch (event.type) {
            case WsEvents.CreateCanvas: {
                const roomName: string = event.value;
                if (roomName) {
                    const room = new CanvasRoom(roomName);
                    this.canvasRooms.set(room.id, room);

                    client.send(JSON.stringify( new AbstractEvent(
                        WsEvents.CanvasCreated,  new CanvasCreatedEvent(room.id, roomName)
                        )));
                }
                break;
            }
            case WsEvents.RegisterForCanvas: {
                const registerEvent: RegisterForCanvas = event.value;
                console.log("server: got register event", registerEvent.canvasId)
                const canvasId = registerEvent.canvasId;
                if (canvasId) {
                    const room = this.canvasRooms.get(canvasId);
                    if (room) {
                        room.addSession(client);
                        client.send(JSON.stringify(new RegisteredForCanvas(canvasId, room.getCurrentEvents())));
                    }
                }
                break;
            }
            case WsEvents.CanvasEvent: {

            }
        }
    }


}

