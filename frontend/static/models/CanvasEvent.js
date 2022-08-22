export class CanvasEvent {
    constructor(type, shapeType, shape) {
        this.type = type;
        this.shapeType = shapeType;
        this.shape = shape;
        // this.user = user;
        this.eventId = CanvasEvent.counter++;
    }
    copy() {
        console.log("in copy event", this);
        const copyEvent = new CanvasEvent(this.type, this.shapeType, this.shape.copyShape());
        copyEvent.eventId--;
        return copyEvent;
    }
}
CanvasEvent.counter = 0;
//# sourceMappingURL=CanvasEvent.js.map