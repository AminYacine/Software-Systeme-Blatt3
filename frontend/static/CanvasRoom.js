export class CanvasRoom {
    constructor(name, id) {
        this.name = name;
        this.clients = [];
        this.shapesInCanvas = new Map();
        this.id = id;
    }
    addSession(session) {
        this.clients.push(session);
    }
    removeSession(session) {
        this.clients = this.clients.filter((ws) => {
            return ws !== session;
        });
    }
    addEvent(id, canvasEvent) {
        this.shapesInCanvas.set(id, canvasEvent);
    }
    removeShape(id) {
        this.shapesInCanvas.delete(id);
    }
    getCurrentEvents() {
        return Array.from(this.shapesInCanvas.values());
    }
}
CanvasRoom.counter = 0;
//# sourceMappingURL=CanvasRoom.js.map