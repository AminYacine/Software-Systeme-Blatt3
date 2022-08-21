import * as WebSocket from "ws";
import {v4} from "uuid";
import { EventTypes} from "./frontend/static/Event.js";
import {Shape} from "./frontend/static/types.js";
import {RoomEvent} from "./frontend/static/RoomEvent.js";

export class CanvasRoom {
    id: string;
    private clients: Map<number, WebSocket> = new Map();
    private shapesInCanvas: Map<string, Shape> = new Map();
    private selectedShapes: Map<string, number> = new Map();

    private eventsInCanvas: Map<string, RoomEvent> = new Map();


    constructor(public name: string) {
        //generates a random uuid
        this.id = v4();
    }

    addSession(id: number, session: WebSocket) {
        this.clients.set(id, session);
    }

    removeSession(clientId: number) {
        this.clients.delete(clientId);
    }

    addEvent(roomEvent: RoomEvent) {
        const canvasEvent = roomEvent.canvasEvent;
        const clientId = roomEvent.clientId;
        const shape = canvasEvent.shape;

        switch (canvasEvent.type) {
            case EventTypes.ShapeAdded: {
                this.shapesInCanvas.set(shape.id, shape);
                this.eventsInCanvas.set(shape.id, roomEvent);
                break;
            }
            case EventTypes.ShapeRemoved: {
                this.shapesInCanvas.delete(shape.id);
                this.eventsInCanvas.delete(shape.id);
                this.selectedShapes.delete(shape.id);
                break;
            }
            case EventTypes.MovedToBackground: {
                const helperMap: Map<string, Shape> = new Map();
                helperMap.set(shape.id, shape);
                this.shapesInCanvas = new Map([...helperMap, ...this.shapesInCanvas]);

                const helperMap2: Map<string, RoomEvent> = new Map();
                helperMap2.set(shape.id, roomEvent);
                this.eventsInCanvas = new Map([...helperMap2, ...this.eventsInCanvas]);
                break;
            }
            case EventTypes.ShapeSelected: {
                this.selectedShapes.set(shape.id, clientId);
                break;
            }
            case EventTypes.ShapeUnselected: {
                this.selectedShapes.delete(shape.id);
                break;
            }
        }
        console.log("selectedShapes", this.selectedShapes);

    }

    removeEvent(id: string) {
        this.eventsInCanvas.delete(id);
    }

    getCurrentEvents(): RoomEvent[] {
       return Array.from(this.eventsInCanvas.values());
    }

    getClientsExcept(clientId: number): WebSocket[] {
        let filteredClients: WebSocket[] = [];
        this.clients.forEach((websocket, id) => {

            if (id !== clientId) {
                filteredClients.push(websocket);
            }
        });
        return filteredClients;
    }

    getSelectedShapes() {
        return this.selectedShapes;
    }
}