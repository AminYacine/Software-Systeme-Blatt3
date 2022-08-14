import { v4 } from "uuid";
export class CanvasRoom {
    constructor(name) {
        this.name = name;
        this.clients = new Map();
        this.shapesInCanvas = new Map();
        this.id = v4();
    }
    addSession(id, session) {
        this.clients.set(id, session);
    }
    removeSession(clientId) {
        this.clients.delete(clientId);
    }
    addEvent(id, canvasEvent) {
        this.shapesInCanvas.set(id, canvasEvent);
    }
    removeEvent(id) {
        this.shapesInCanvas.delete(id);
    }
    getCurrentEvents() {
        return Array.from(this.shapesInCanvas.values());
    }
}
//# sourceMappingURL=CanvasRoom.js.map