import * as WebSocket from "ws";
import {AbstractEventDTO} from "./frontend/static/dtos/AbstractEventDTO.js";
import {RegisteredForCanvasEventDTO} from "./frontend/static/dtos/RegisteredForCanvasEventDTO.js";
import {CanvasCreatedEventDTO} from "./frontend/static/dtos/CanvasCreatedEventDTO.js";
import {WebSocketEvents} from "./frontend/static/enums/WebSocketEvents.js";
import {RegisterForCanvasEventDTO} from "./frontend/static/dtos/RegisterForCanvasEventDTO.js";
import {CanvasRoom} from "./CanvasRoom.js";
import {ConnectedEventDTO} from "./frontend/static/dtos/ConnectedEventDTO.js";
import {CreateCanvasEventDTO} from "./frontend/static/dtos/CreateCanvasEventDTO.js";
import {DeregisterFromCanvasEventDTO} from "./frontend/static/dtos/DeregisterFromCanvasEventDTO.js";
import {RoomEvent} from "./frontend/static/models/RoomEvent.js";
import {GetCanvasEventsDTO} from "./frontend/static/dtos/GetCanvasEventsDTO.js";
import {GetCanvasEventsResponseDTO} from "./frontend/static/dtos/GetCanvasEventsResponseDTO.js";
import {CanvasEvent} from "./frontend/static/models/CanvasEvent.js";
import {EventTypes} from "./frontend/static/enums/EventTypes.js";

export class WsService {
    private clientIdCounter = 1;
    private clients: Map<number, WebSocket> = new Map();
    private canvasRooms: Map<string, CanvasRoom> = new Map();

    constructor() {
    }


    /**
     * parses the message to an AbstractEvent and handles it depending on the event type
     * @param message received message
     * @param client sender of the message
     */
    handleMessage(message: string, client: WebSocket) {
        const event: AbstractEventDTO = JSON.parse(message);

        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                this.handleCreateCanvas(client, event.value);
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                this.handleRegisterForCanvas(client, event.value);
                break;
            }
            case WebSocketEvents.DeregisterForCanvas: {
                this.handleDeregisterForCanvas(client, event.value);
                break;
            }
            case WebSocketEvents.GetCanvasEvents : {
                this.handleGetCanvasEvents(client, event.value);
                break;
            }
            case WebSocketEvents.SessionID: {
                this.handleSessionIdEvent(client, event.value);
                break;
            }
            case WebSocketEvents.CanvasEvent: {
                this.handleCanvasEvent(event.value);
                break;
            }
        }
    }


    /**
     * creates new client id and sends the id to the client
     * @param client
     */
    handleConnection(client: WebSocket) {
        this.sendToClient(client,
            WebSocketEvents.CreatedClientId,
            new ConnectedEventDTO(this.getNewClientID(), Array.from(this.canvasRooms.values())));
    }

    /**
     * sends a message to a list of clients
     * @param clients list of message is sent to
     * @param eventType type of event
     * @param value value of event
     * @private
     */
    broadCastEvent(clients: WebSocket[], eventType: WebSocketEvents, value: any) {
        clients.forEach(client => {
            client.send(JSON.stringify(new AbstractEventDTO(
                eventType, value
            )));
        });
    }

    /**
     * sends a message to the passed client
     * @param client the message is sent to
     * @param eventType type of the event
     * @param value value of the event
     * @private
     */
    private sendToClient(client: WebSocket.WebSocket, eventType: WebSocketEvents, value: any) {
        client.send(JSON.stringify(
            new AbstractEventDTO(
                eventType,
                value
            )
        ));
    }

    /**
     * returns a new client id
     * @private
     */
    private getNewClientID() {
        return this.clientIdCounter++;
    }


    /**
     * checks if a client with the given id exists, returns true if so
     * @param clientId
     * @private
     */
    private clientExists(clientId: number): boolean {
        return this.clients.has(clientId);
    }

    /**
     * return an array of the current clients
     * @private
     */
    private getAllClients(): WebSocket [] {
        return Array.from(this.clients.values());
    }

    /**
     * creates a new CanvasRoom, adds the sender client and responds to the client with a CanvasCreated event
     * @param client sender of the event
     * @param createCanvasEvent the value of the received message
     * @private
     */
    private handleCreateCanvas(client: WebSocket, createCanvasEvent: CreateCanvasEventDTO) {
        const clientId = createCanvasEvent.clientId;
        if (this.clientExists(clientId)) {
            const canvasName: string = createCanvasEvent.canvasName;
            if (canvasName) {
                const canvas = new CanvasRoom(canvasName);
                canvas.addSession(clientId, client);
                this.canvasRooms.set(canvas.id, canvas);

                this.broadCastEvent(this.getAllClients(),
                    WebSocketEvents.CanvasCreated,
                    new CanvasCreatedEventDTO(canvas.id, canvasName, clientId)
                );
            }
        }
    }

    /**
     * adds the client to the requested CanvasRoom and sends a confirmation to the client
     * @param client sender of the event
     * @param registerEvent
     * @private
     */
    private handleRegisterForCanvas(client: WebSocket, registerEvent: RegisterForCanvasEventDTO) {
        const canvasId = registerEvent.canvasId;
        const clientId = registerEvent.clientId;
        if (canvasId !== undefined && clientId !== undefined) {
            const room = this.canvasRooms.get(canvasId);
            if (room) {
                if (this.clientExists(clientId)) {
                    room.addSession(clientId, client);

                    this.sendToClient(client,
                        WebSocketEvents.RegisteredForCanvas,
                        new RegisteredForCanvasEventDTO(canvasId)
                    );
                }
            }
        }
    }

    /**
     * removes the client from the client list of the requested CanvasRoom
     * @param client sender of the event
     * @param deregisterEvent
     * @private
     */
    private handleDeregisterForCanvas(client: WebSocket, deregisterEvent: DeregisterFromCanvasEventDTO) {
        const canvasId = deregisterEvent.canvasId;
        const clientId = deregisterEvent.clientId;
        if (canvasId) {
            const room = this.canvasRooms.get(canvasId);
            if (room) {
                room.removeSession(clientId);
                room.selectedShapes.forEach((clientIdOfShape, shapeId) => {
                    if (clientIdOfShape === clientId) {
                        room.selectedShapes.delete(shapeId);
                        const shape = room.shapesInCanvas.get(shapeId);
                        this.broadCastEvent(
                            room.getClientsExcept(clientId),
                            WebSocketEvents.CanvasChangedEvent,
                            new RoomEvent(
                                clientId, room.id,
                                new CanvasEvent(
                                    EventTypes.ShapeUnselected,
                                    shape.type,
                                    shape
                                )
                            )
                        );
                    }
                });
            }
        }
    }

    private handleGetCanvasEvents(client: WebSocket, getCanvasEventsDTO: GetCanvasEventsDTO) {
        const clientId = getCanvasEventsDTO.clientId;
        const canvasId = getCanvasEventsDTO.canvasId;
        const room = this.canvasRooms.get(canvasId);

        if (room) {
            if (this.clientExists(clientId)) {
                const events = room.getCurrentEvents();
                const res = new GetCanvasEventsResponseDTO(canvasId, events, Object.fromEntries(room.getSelectedShapes()));
                this.sendToClient(client, WebSocketEvents.GetCanvasEventsResponse, res);
            }
        }
    }

    private handleSessionIdEvent(client: WebSocket, id: number) {
        this.clients.set(id, client);
        this.canvasRooms.forEach(room => {
            room.updateClientSession(id, client);
        });
    }

    private handleCanvasEvent(roomEvent: RoomEvent) {
        const roomId = roomEvent.roomId;
        const clientId = roomEvent.clientId;

        const room = this.canvasRooms.get(roomId);
        if (room !== undefined) {
            room.addEvent(roomEvent);
            const roomClients = room.getClientsExcept(clientId);
            this.broadCastEvent(roomClients, WebSocketEvents.CanvasChangedEvent, roomEvent);
        }
    }
}

