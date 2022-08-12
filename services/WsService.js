import { CanvasRoom } from "../frontend/static/CanvasRoom.js";
import { AbstractEvent } from "../ws-events/AbstractEvent.js";
import { RegisteredForCanvasEvent } from "../frontend/static/RegisteredForCanvasEvent.js";
import { CanvasCreatedEvent } from "../ws-events/CanvasCreatedEvent.js";
import { WebSocketEvents } from "../frontend/static/WebSocketEvents.js";
import { ConnectedEvent } from "../frontend/static/ConnectedEvent.js";
export class WsService {
    constructor() {
        this.clientIdCounter = 0;
        this.clients = new Map();
        this.canvasRooms = new Map();
    }
    handleMessage(message, client) {
        const event = JSON.parse(message);
        console.log("received message: ", event);
        switch (event.type) {
            case WebSocketEvents.CreateCanvas: {
                const roomName = event.value;
                if (roomName) {
                    const room = new CanvasRoom(roomName);
                    this.canvasRooms.set(room.id, room);
                    client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CanvasCreated, new CanvasCreatedEvent(room.id, roomName))));
                }
                break;
            }
            case WebSocketEvents.RegisterForCanvas: {
                const registerEvent = event.value;
                const canvasId = registerEvent.canvasId;
                console.log("server: got register event", canvasId);
                if (canvasId !== undefined) {
                    const room = this.canvasRooms.get(canvasId);
                    console.log("found Room:", room);
                    console.log("all Rooms:", this.canvasRooms);
                    if (room) {
                        room.addSession(client);
                        client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.RegisteredForCanvas, new RegisteredForCanvasEvent(canvasId, room.getCurrentEvents()))));
                        console.log("send registeredEvent");
                    }
                }
                break;
            }
            case WebSocketEvents.CanvasEvent: {
            }
        }
    }
    handleConnection(client) {
        const id = this.addClient(client);
        client.send(JSON.stringify(new AbstractEvent(WebSocketEvents.ClientId, new ConnectedEvent(id, Array.from(this.canvasRooms.values())))));
    }
    addClient(ws) {
        const newId = this.getNewClientID();
        this.clients.set(newId, ws);
        return newId;
    }
    getNewClientID() {
        return this.clientIdCounter++;
    }
}
//# sourceMappingURL=WsService.js.map