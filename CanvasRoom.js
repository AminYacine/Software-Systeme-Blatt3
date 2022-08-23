import { v4 } from "uuid";
import { EventTypes } from "./frontend/static/enums/EventTypes.js";
export class CanvasRoom {
    constructor(name) {
        this.name = name;
        this.clients = new Map();
        this._shapesInCanvas = new Map();
        this._selectedShapes = new Map();
        this.eventsInCanvas = new Map();
        //generates a random uuid
        this.id = v4();
    }
    get shapesInCanvas() {
        return this._shapesInCanvas;
    }
    get selectedShapes() {
        return this._selectedShapes;
    }
    addSession(id, session) {
        this.clients.set(id, session);
    }
    removeSession(clientId) {
        this.clients.delete(clientId);
    }
    addEvent(roomEvent) {
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
                const helperMap = new Map();
                helperMap.set(shape.id, shape);
                this._shapesInCanvas = new Map([...helperMap, ...this._shapesInCanvas]);
                const helperMap2 = new Map();
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
    getCurrentEvents() {
        return Array.from(this.eventsInCanvas.values());
    }
    getClientsExcept(clientId) {
        let filteredClients = [];
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
//# sourceMappingURL=CanvasRoom.js.map