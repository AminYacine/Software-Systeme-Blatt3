import * as WebSocket from "ws";
import {AbstractEvent} from "../ws-events/AbstractEvent.js";
import {RegisteredForCanvasEvent} from "../frontend/static/RegisteredForCanvasEvent.js";
import {CanvasCreatedEvent} from "../ws-events/CanvasCreatedEvent.js";
import {WebSocketEvents} from "../frontend/static/WebSocketEvents.js";

import {RegisterForCanvas} from "../frontend/static/RegisterForCanvas.js";
import {CanvasRoom} from "../CanvasRoom.js";
import {ConnectedEvent} from "../ConnectedEvent";

export class WsService {
    private clientIdCounter = 0;
    private clients: Map<number, WebSocket> = new Map<number, WebSocket>();
    private canvasRooms: Map<string, CanvasRoom> = new Map();

    constructor() {
    }


    handleMessage(message: string, client: WebSocket.WebSocket) {
        const event: AbstractEvent = JSON.parse(message);
        console.log("received message: ", event);

        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                const roomName: string = event.value;
                if (roomName) {
                    const room = new CanvasRoom(roomName);
                    this.canvasRooms.set(room.id, room);

                    client.send(JSON.stringify(new AbstractEvent(
                        WebSocketEvents.CanvasCreated,
                        new CanvasCreatedEvent(room.id, roomName)
                    )));
                }
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                const registerEvent: RegisterForCanvas = event.value;
                const canvasId = registerEvent.canvasId;
                console.log("server: got register event", canvasId);
                if (canvasId !== undefined) {
                    const room = this.canvasRooms.get(canvasId);

                    if (room) {
                        room.addSession(client);
                        client.send(JSON.stringify(new AbstractEvent(
                            WebSocketEvents.RegisteredForCanvas,
                            new RegisteredForCanvasEvent(canvasId, room.getCurrentEvents())
                        )));
                        console.log("send registeredEvent");
                    }
                }
                break;
            }
            case WebSocketEvents.CanvasEvent: {

            }
        }
    }


    handleConnection(client: WebSocket.WebSocket) {
        const id = this.addClient(client);
        client.send(JSON.stringify(new AbstractEvent(
            WebSocketEvents.ClientId,
            new ConnectedEvent(id, Array.from(this.canvasRooms.values()))
        )));
    }

    private addClient(ws: WebSocket.WebSocket): number {
        const newId = this.getNewClientID();
        this.clients.set(newId, ws);
        return newId;
    }

    private getNewClientID() {
        return this.clientIdCounter++;
    }
}

