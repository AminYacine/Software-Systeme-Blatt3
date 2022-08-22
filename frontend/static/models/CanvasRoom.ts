import * as WebSocket from "ws";
import {CanvasEvent} from "./CanvasEvent.js";

export class CanvasRoom {
    private static counter = 0;
    id: string;
    private clients: WebSocket[] = [];
    private shapesInCanvas: Map<string, CanvasEvent> = new Map();


    constructor(public name: string, id: string) {
        this.id = id;
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