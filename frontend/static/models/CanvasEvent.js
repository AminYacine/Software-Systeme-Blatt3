export class CanvasEvent {
    constructor(type, shapeType, shape) {
        this.type = type;
        this.shapeType = shapeType;
        this.shape = shape;
        this.eventId = CanvasEvent.counter++;
    }
}
CanvasEvent.counter = 0;
//# sourceMappingURL=CanvasEvent.js.map