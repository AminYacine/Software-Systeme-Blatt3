import { CanvasRoom } from "./CanvasRoom.js";
import { AbstractEvent } from "../ws-events/AbstractEvent.js";
import { WsEvents } from "../ws-events/WsEvents.js";
import { RegisteredForCanvas } from "../ws-events/RegisteredForCanvas.js";
import { CanvasCreatedEvent } from "../ws-events/CanvasCreatedEvent.js";
export class WsService {
    constructor() {
        this.clientIdCounter = 0;
        this.clients = new Map();
        this.canvasRooms = new Map();
    }
    addClient(ws) {
        const newId = this.getNewClientID();
        this.clients.set(newId, ws);
        return newId;
    }
    getNewClientID() {
        return this.clientIdCounter++;
    }
    handleMessage(message, client) {
        const event = JSON.parse(message);
        console.log("received message: ", event);
        switch (event.type) {
            case WsEvents.CreateCanvas: {
                const roomName = event.value;
                if (roomName) {
                    const room = new CanvasRoom(roomName);
                    this.canvasRooms.set(room.id, room);
                    client.send(JSON.stringify(new AbstractEvent(WsEvents.CanvasCreated, new CanvasCreatedEvent(room.id, roomName))));
                }
                break;
            }
            case WsEvents.RegisterForCanvas: {
                const registerEvent = event.value;
                console.log("server: got register event", registerEvent.canvasId);
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
//# sourceMappingURL=WsService.js.map