import * as WebSocket from "ws";
import {CanvasEvent} from "./Event.js";


export class CanvasRoom {
    private static counter = 0;
    id: number;
    private clients:WebSocket[] = [];
    private shapesInCanvas: Map<number, CanvasEvent> = new Map();


    constructor(public name: string) {
        this.id = CanvasRoom.counter++;
    }

    addSession(session: WebSocket) {
        this.clients.push(session);
    }

    removeSession(session: WebSocket) {
        this.clients = this.clients.filter((ws)=> {
            return ws !== session;
        });
    }

    addEvent(id: number, canvasEvent: CanvasEvent) {
        this.shapesInCanvas.set(id, canvasEvent)
    }

    removeShape(id: number) {
        this.shapesInCanvas.delete(id);
    }

    getCurrentEvents(): CanvasEvent[]{
        return Array.from(this.shapesInCanvas.values());
    }
}