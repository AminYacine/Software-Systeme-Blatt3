import { v4 } from "uuid";
import { CanvasEvent, EventTypes } from "./frontend/static/Event.js";
import { Circle, Line, Rectangle, Triangle } from "./frontend/static/Shapes.js";
export class CanvasRoom {
    constructor(name) {
        this.name = name;
        this.clients = new Map();
        this.shapesInCanvas = new Map();
        this.blockedShapes = new Map();
        this.eventsInCanvas = new Map();
        this.id = v4();
    }
    addSession(id, session) {
        this.clients.set(id, session);
    }
    removeSession(clientId) {
        this.clients.delete(clientId);
    }
    addEvent(id, canvasEvent) {
        this.eventsInCanvas.set(id, canvasEvent);
    }
    removeEvent(id) {
        this.eventsInCanvas.delete(id);
    }
    getCurrentEvents() {
        const eventArray = [];
        this.shapesInCanvas.forEach((shape, id) => {
            eventArray.push(new CanvasEvent(EventTypes.ShapeAdded, this.getShapeType(shape), shape));
        });
        return eventArray;
    }
    handleCanvasEvent(event) {
        const eventShape = event.shape;
        switch (event.type) {
            case EventTypes.ShapeAdded: {
                this.shapesInCanvas.set(eventShape.id, eventShape);
                break;
            }
            case EventTypes.ShapeRemoved: {
                this.shapesInCanvas.delete(eventShape.id);
                break;
            }
            case EventTypes.MovedToBackground: {
                const helperMap = new Map();
                helperMap.set(eventShape.id, eventShape);
                this.shapesInCanvas = new Map([...helperMap, ...this.shapesInCanvas]);
                break;
            }
            case EventTypes.ShapeSelected: {
            }
        }
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
    getShapeType(shape) {
        if (shape instanceof Line) {
            return "Line";
        }
        else if (shape instanceof Rectangle) {
            return "Rectangle";
        }
        else if (shape instanceof Circle) {
            return "Circle";
        }
        else if (shape instanceof Triangle) {
            return "Triangle";
        }
    }
}
//# sourceMappingURL=CanvasRoom.js.map