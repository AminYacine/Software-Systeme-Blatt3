import * as WebSocket from "ws";
import {v4} from "uuid";
import {CanvasEvent, EventTypes} from "./frontend/static/Event.js";
import {Shape} from "./frontend/static/types.js";
import {Circle, Line, Rectangle, Triangle} from "./frontend/static/Shapes.js";

export class CanvasRoom {
    id: string;
    private clients: Map<number, WebSocket> = new Map();
    private shapesInCanvas: Map<number, Shape> = new Map();
    private blockedShapes: Map<number, Shape> = new Map();

    private eventsInCanvas: Map<number, CanvasEvent> = new Map();


    constructor(public name: string) {
        this.id = v4();
    }

    addSession(id: number, session: WebSocket) {
        this.clients.set(id, session);
    }

    removeSession(clientId: number) {
        this.clients.delete(clientId);
    }

    addEvent(id: number, canvasEvent: CanvasEvent) {
        this.eventsInCanvas.set(id, canvasEvent);
    }

    removeEvent(id: number) {
        this.eventsInCanvas.delete(id);
    }

    getCurrentEvents(): CanvasEvent[] {
        const eventArray: CanvasEvent[] = [];
        this.shapesInCanvas.forEach((shape, id) => {
            eventArray.push(new CanvasEvent(EventTypes.ShapeAdded, this.getShapeType(shape),shape));
        });
        return eventArray;
    }

    handleCanvasEvent(event: CanvasEvent) {
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
                const helperMap: Map<number, Shape> = new Map();
                helperMap.set(eventShape.id, eventShape);
                this.shapesInCanvas = new Map([...helperMap, ...this.shapesInCanvas]);
                break;
            }
            case EventTypes.ShapeSelected: {

            }
        }
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

    private getShapeType(shape) {
        if (shape instanceof Line) {
            return "Line";
        } else if (shape instanceof Rectangle) {
            return "Rectangle";
        } else if (shape instanceof Circle) {
            return "Circle";
        } else if (shape instanceof Triangle){
            return "Triangle";
        }
    }
}