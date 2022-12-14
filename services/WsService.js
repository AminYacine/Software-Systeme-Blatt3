import { AbstractEvent } from "../frontend/static/AbstractEvent.js";
import { RegisteredForCanvasEvent } from "../frontend/static/RegisteredForCanvasEvent.js";
import { CanvasCreatedEvent } from "../ws-events/CanvasCreatedEvent.js";
import { WebSocketEvents } from "../frontend/static/WebSocketEvents.js";
import { CanvasRoom } from "../CanvasRoom.js";
import { ConnectedEvent } from "../ConnectedEvent.js";
import { GetCanvasEventsResponse } from "../frontend/static/GetCanvasEventsResponse.js";
export class WsService {
    constructor() {
        this.clientIdCounter = 1;
        this.clients = new Map();
        this.canvasRooms = new Map();
    }
    handleMessage(message, client) {
        const event = JSON.parse(message);
        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                const createCanvasEvent = event.value;
                const clientId = createCanvasEvent.clientId;
                if (!this.checkClientId(clientId)) {
                    return;
                }
                const canvasName = createCanvasEvent.canvasName;
                if (canvasName) {
                    const canvas = new CanvasRoom(canvasName);
                    canvas.addSession(clientId, client);
                    this.canvasRooms.set(canvas.id, canvas);
                    this.broadCastEvent(Array.from(this.clients.values()), new AbstractEvent(WebSocketEvents.CanvasCreated, new CanvasCreatedEvent(canvas.id, canvasName, clientId)));
                }
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                const registerEvent = event.value;
                const canvasId = registerEvent.canvasId;
                const clientId = registerEvent.clientId;
                if (canvasId !== undefined && clientId !== undefined) {
                    const room = this.canvasRooms.get(canvasId);
                    if (room) {
                        if (this.checkClientId(clientId)) {
                            room.addSession(clientId, client);
                            client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.RegisteredForCanvas, new RegisteredForCanvasEvent(canvasId))));
                        }
                    }
                }
                break;
            }
            case WebSocketEvents.DeregisterForCanvas: {
                const deregisterEvent = event.value;
                const canvasId = deregisterEvent.canvasId;
                if (canvasId) {
                    const room = this.canvasRooms.get(canvasId);
                    if (room) {
                        room.removeSession(deregisterEvent.clientId);
                    }
                }
                break;
            }
            case WebSocketEvents.GetCanvasEvents: {
                const dto = event.value;
                const clientId = dto.clientId;
                const canvasId = dto.canvasId;
                const room = this.canvasRooms.get(canvasId);
                if (room) {
                    if (this.checkClientId(clientId)) {
                        const events = room.getCurrentEvents();
                        const res = new GetCanvasEventsResponse(canvasId, events, Object.fromEntries(room.getSelectedShapes()));
                        client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.GetCanvasEventsResponse, res)));
                    }
                }
                break;
            }
            case WebSocketEvents.SessionID: {
                const id = event.value;
                this.clients.set(id, client);
                break;
            }
            case WebSocketEvents.CanvasEvent: {
                const roomEvent = event.value;
                const roomId = roomEvent.roomId;
                const clientId = roomEvent.clientId;
                const room = this.canvasRooms.get(roomId);
                if (room !== undefined) {
                    room.addEvent(roomEvent);
                    const roomClients = room.getClientsExcept(clientId);
                    this.broadCastEvent(roomClients, new AbstractEvent(WebSocketEvents.CanvasChangedEvent, roomEvent));
                }
            }
        }
    }
    handleConnection(client) {
        const id = this.getNewClientID();
        client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CreatedClientId, new ConnectedEvent(id, Array.from(this.canvasRooms.values())))));
    }
    broadCastEvent(clients, event) {
        clients.forEach(client => {
            client.send(JSON.stringify(event));
        });
    }
    getNewClientID() {
        return this.clientIdCounter++;
    }
    checkClientId(clientId) {
        return this.clients.has(clientId);
    }
}
//# sourceMappingURL=WsService.js.map