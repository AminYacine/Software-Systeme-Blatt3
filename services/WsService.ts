import * as WebSocket from "ws";
import {AbstractEvent} from "../frontend/static/AbstractEvent.js";
import {RegisteredForCanvasEvent} from "../frontend/static/RegisteredForCanvasEvent.js";
import {CanvasCreatedEvent} from "../ws-events/CanvasCreatedEvent.js";
import {WebSocketEvents} from "../frontend/static/WebSocketEvents.js";
import {RegisterForCanvas} from "../frontend/static/RegisterForCanvas.js";
import {CanvasRoom} from "../CanvasRoom.js";
import {ConnectedEvent} from "../ConnectedEvent.js";
import {CreateCanvasEvent} from "../frontend/static/CreateCanvasEvent.js";
import {DeregisterFromCanvasEvent} from "../frontend/static/DeregisterFromCanvasEvent.js";

export class WsService {
    private clientIdCounter = 1;
    private clients: Map<number, WebSocket> = new Map();
    private canvasRooms: Map<string, CanvasRoom> = new Map();

    constructor() {
    }

    handleMessage(message: string, client: WebSocket.WebSocket) {
        const event: AbstractEvent = JSON.parse(message);
        console.log("received message: ", event);

        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                const createCanvasEvent: CreateCanvasEvent = event.value;
                const clientId = createCanvasEvent.clientId;
                if (!this.checkClientId(clientId)) {
                    return
                }
                const canvasName: string = createCanvasEvent.canvasName;
                if (canvasName) {
                    const canvas = new CanvasRoom(canvasName);
                    canvas.addSession(clientId, client);
                    this.canvasRooms.set(canvas.id, canvas);

                    this.broadCastEvent( Array.from(this.clients.values()) ,new AbstractEvent(
                        WebSocketEvents.CanvasCreated,
                        new CanvasCreatedEvent(canvas.id, canvasName, clientId)
                    ));
                }
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                const registerEvent: RegisterForCanvas = event.value;
                const canvasId = registerEvent.canvasId;
                const clientId = registerEvent.clientId;
                console.log("server: got register event", canvasId);
                if (canvasId !== undefined && clientId !== undefined) {
                    const room = this.canvasRooms.get(canvasId);

                    if (room) {
                        if (this.checkClientId(clientId)) {
                            room.addSession(clientId, client);
                            client.send(JSON.stringify(new AbstractEvent(
                                WebSocketEvents.RegisteredForCanvas,
                                new RegisteredForCanvasEvent(canvasId, room.getCurrentEvents())
                            )));
                            console.log("send registeredEvent");
                        }
                    }
                }
                break;
            }
            case WebSocketEvents.DeregisterForCanvas: {
                const deregisterEvent: DeregisterFromCanvasEvent = event.value;
                const canvasId = deregisterEvent.canvasId;
                if (canvasId) {
                    const room = this.canvasRooms.get(canvasId);
                    if (room) {
                        room.removeSession(deregisterEvent.clientId);
                        console.log("removed from canvas");
                    }
                }

                break;
            }
            case WebSocketEvents.SessionID: {
                const id: number = event.value;
                this.clients.set(id, client);
                console.log("clients:", this.clients.keys())
                break;
            }
            case WebSocketEvents.CanvasEvent: {

            }
        }
    }

    handleConnection(client: WebSocket.WebSocket) {
        const id = this.getNewClientID();
        client.send(JSON.stringify(new AbstractEvent(
            WebSocketEvents.CreatedClientId,
            new ConnectedEvent(id, Array.from(this.canvasRooms.values()))
        )));
    }


    private broadCastEvent(clients: WebSocket[], event: AbstractEvent) {
        clients.forEach(client => {
            client.send(JSON.stringify( event));
        });
    }

    private getNewClientID() {
        return this.clientIdCounter++;
    }

    private checkClientId(clientId: number): boolean {
        return this.clients.has(clientId);
    }
}

