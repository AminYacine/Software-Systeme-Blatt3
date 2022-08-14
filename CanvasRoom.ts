import * as WebSocket from "ws";
import {v4} from "uuid";
import {CanvasEvent} from "./frontend/static/Event";

export class CanvasRoom {
    id: string;
    private clients: Map<number, WebSocket> = new Map();
    private shapesInCanvas: Map<string, CanvasEvent> = new Map();


    constructor(public name: string) {
        this.id = v4();
    }

    addSession(id: number, session: WebSocket) {
        this.clients.set(id, session);
    }

    removeSession(clientId: number) {
        this.clients.delete(clientId);
    }

    addEvent(id: string, canvasEvent: CanvasEvent) {
        this.shapesInCanvas.set(id, canvasEvent)
    }

    removeEvent(id: string) {
        this.shapesInCanvas.delete(id);
    }

    getCurrentEvents(): CanvasEvent[] {
        return Array.from(this.shapesInCanvas.values());
    }
}