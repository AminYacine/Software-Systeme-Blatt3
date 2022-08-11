import * as WebSocket from "ws";
import {Shape} from "../frontend/static/types.js";
import {CanvasEvent, EventTypes} from "../frontend/static/Event";


export class CanvasRoom {
    private static counter = 0;
    id: number;
    private clients:WebSocket[] = [];
    private shapesInCanvas: Map<number, CanvasEvent> = new Map();


    constructor(private name: string) {
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