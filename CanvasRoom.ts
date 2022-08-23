import * as WebSocket from "ws";
import {v4} from "uuid";
import {EventTypes} from "./frontend/static/enums/EventTypes.js";
import {Shape} from "./frontend/static/canvas/types.js";
import {RoomEvent} from "./frontend/static/models/RoomEvent.js";

export class CanvasRoom {
    id: string;
    private clients: Map<number, WebSocket> = new Map();
    private _shapesInCanvas: Map<string, Shape> = new Map();
    private _selectedShapes: Map<string, number> = new Map();

    private eventsInCanvas: Map<string, RoomEvent> = new Map();

    get shapesInCanvas(): Map<string, Shape> {
        return this._shapesInCanvas;
    }

    get selectedShapes(): Map<string, number> {
        return this._selectedShapes;
    }

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
                this._shapesInCanvas.set(shape.id, shape);
                this.eventsInCanvas.set(shape.id, roomEvent);
                break;
            }
            case EventTypes.ShapeRemoved: {
                this._shapesInCanvas.delete(shape.id);
                this.eventsInCanvas.delete(shape.id);
                this._selectedShapes.delete(shape.id);
                break;
            }
            case EventTypes.MovedToBackground: {
                const helperMap: Map<string, Shape> = new Map();
                helperMap.set(shape.id, shape);
                this._shapesInCanvas = new Map([...helperMap, ...this._shapesInCanvas]);

                const helperMap2: Map<string, RoomEvent> = new Map();
                helperMap2.set(shape.id, roomEvent);
                this.eventsInCanvas = new Map([...helperMap2, ...this.eventsInCanvas]);
                break;
            }
            case EventTypes.ShapeSelected: {
                this._selectedShapes.set(shape.id, clientId);
                break;
            }
            case EventTypes.ShapeUnselected: {
                this._selectedShapes.delete(shape.id);
                break;
            }
        }
        console.log("selectedShapes", this._selectedShapes);

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
        return this._selectedShapes;
    }
}