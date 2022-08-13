import * as WebSocket from "ws";
import {v4} from "uuid";
import {CanvasEvent} from "./frontend/static/Event";

export class CanvasRoom {
    private static counter = 0;
    id: string;
    private clients: WebSocket[] = [];
    private shapesInCanvas: Map<string, CanvasEvent> = new Map();


    constructor(public name: string) {

        this.id = v4();
    }

    addSession(session: WebSocket) {
        this.clients.push(session);
    }

    removeSession(session: WebSocket) {
        this.clients = this.clients.filter((ws) => {
            return ws !== session;
        });
    }

    addEvent(id: string, canvasEvent: CanvasEvent) {
        this.shapesInCanvas.set(id, canvasEvent)
    }

    removeShape(id: string) {
        this.shapesInCanvas.delete(id);
    }

    getCurrentEvents(): CanvasEvent[] {
        return Array.from(this.shapesInCanvas.values());
    }
}