import * as WebSocket from "ws";
import {AbstractEventDTO} from "../frontend/static/dtos/AbstractEventDTO.js";
import {RegisteredForCanvasEventDTO} from "../frontend/static/dtos/RegisteredForCanvasEventDTO.js";
import {CanvasCreatedEvent} from "../ws-events/CanvasCreatedEvent.js";
import {WebSocketEvents} from "../frontend/static/enums/WebSocketEvents.js";
import {RegisterForCanvasEventDTO} from "../frontend/static/dtos/RegisterForCanvasEventDTO.js";
import {CanvasRoom} from "../CanvasRoom.js";
import {ConnectedEvent} from "../ConnectedEvent.js";
import {CreateCanvasEventDTO} from "../frontend/static/dtos/CreateCanvasEventDTO.js";
import {DeregisterFromCanvasEventDTO} from "../frontend/static/dtos/DeregisterFromCanvasEventDTO.js";
import {RoomEvent} from "../frontend/static/models/RoomEvent.js";
import {GetCanvasEventsDTO} from "../frontend/static/dtos/GetCanvasEventsDTO.js";
import {GetCanvasEventsResponseDTO} from "../frontend/static/dtos/GetCanvasEventsResponseDTO.js";

export class WsService {
    private clientIdCounter = 1;
    private clients: Map<number, WebSocket> = new Map();
    private canvasRooms: Map<string, CanvasRoom> = new Map();

    constructor() {
    }

    handleMessage(message: string, client: WebSocket.WebSocket) {
        const event: AbstractEventDTO = JSON.parse(message);
        console.log("received message: ", event.type);

        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                const createCanvasEvent: CreateCanvasEventDTO = event.value;
                const clientId = createCanvasEvent.clientId;
                if (!this.checkClientId(clientId)) {
                    return
                }
                const canvasName: string = createCanvasEvent.canvasName;
                if (canvasName) {
                    const canvas = new CanvasRoom(canvasName);
                    canvas.addSession(clientId, client);
                    this.canvasRooms.set(canvas.id, canvas);

                    this.broadCastEvent(Array.from(this.clients.values()), new AbstractEventDTO(
                        WebSocketEvents.CanvasCreated,
                        new CanvasCreatedEvent(canvas.id, canvasName, clientId)
                    ));
                }
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                const registerEvent: RegisterForCanvasEventDTO = event.value;
                const canvasId = registerEvent.canvasId;
                const clientId = registerEvent.clientId;
                console.log("server: got register event", canvasId);
                if (canvasId !== undefined && clientId !== undefined) {
                    const room = this.canvasRooms.get(canvasId);

                    if (room) {
                        if (this.checkClientId(clientId)) {
                            room.addSession(clientId, client);
                            client.send(JSON.stringify(new AbstractEventDTO(
                                WebSocketEvents.RegisteredForCanvas,
                                new RegisteredForCanvasEventDTO(canvasId)
                            )));
                            console.log("send registeredEvent");
                        }
                    }
                }
                break;
            }
            case WebSocketEvents.DeregisterForCanvas: {
                const deregisterEvent: DeregisterFromCanvasEventDTO = event.value;
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
            case WebSocketEvents.GetCanvasEvents : {
                const dto: GetCanvasEventsDTO = event.value;
                const clientId = dto.clientId;
                const canvasId = dto.canvasId;
                const room = this.canvasRooms.get(canvasId);

                if (room) {
                    if (this.checkClientId(clientId)) {
                        const events = room.getCurrentEvents();
                        const res = new GetCanvasEventsResponseDTO(canvasId, events, Object.fromEntries(room.getSelectedShapes()) )
                        client.send(JSON.stringify(new AbstractEventDTO(
                            WebSocketEvents.GetCanvasEventsResponse,
                            res
                        )));
                        console.log("send selected shapes", res)
                    }
                }
                break;
            }
            case WebSocketEvents.SessionID: {
                const id: number = event.value;
                this.clients.set(id, client);
                break;
            }
            case WebSocketEvents.CanvasEvent: {

                const roomEvent: RoomEvent = event.value;

                const roomId = roomEvent.roomId;
                const clientId = roomEvent.clientId;

                const room = this.canvasRooms.get(roomId);
                if (room !== undefined) {
                    room.addEvent(roomEvent);
                    const roomClients = room.getClientsExcept(clientId);

                    this.broadCastEvent(roomClients, new AbstractEventDTO(WebSocketEvents.CanvasChangedEvent, roomEvent));
                }
            }
        }
    }


    handleConnection(client: WebSocket.WebSocket) {
        const id = this.getNewClientID();
        client.send(JSON.stringify(new AbstractEventDTO(
            WebSocketEvents.CreatedClientId,
            new ConnectedEvent(id, Array.from(this.canvasRooms.values()))
        )));
    }


    private broadCastEvent(clients: WebSocket[], event: AbstractEventDTO) {
        clients.forEach(client => {
            client.send(JSON.stringify(event));
        });
    }

    private getNewClientID() {
        return this.clientIdCounter++;
    }

    private checkClientId(clientId: number): boolean {
        return this.clients.has(clientId);
    }
}

