export class CanvasEvent {
    constructor(type, shape, user, color) {
        this.type = type;
        this.shape = shape;
        this.user = user;
        this.eventId = CanvasEvent.counter++;
        this.color = color;
    }
    copy() {
        const copyEvent = new CanvasEvent(this.type, this.shape.copyShape(), this.user, this.color);
        copyEvent.eventId--;
        return copyEvent;
    }
    incrementIdCounter() {
        CanvasEvent.counter++;
    }
    getId() {
        return this.eventId;
    }
}
CanvasEvent.counter = 0;
export var EventTypes;
(function (EventTypes) {
    EventTypes["ShapeAdded"] = "SHAPE_ADDED";
    EventTypes["MovedToBackground"] = "MOVED_BACKGROUND";
    EventTypes["ShapeRemoved"] = "SHAPE_REMOVED";
    EventTypes["ShapeSelected"] = "SHAPE_SELECTED";
    EventTypes["ShapeUnselected"] = "SHAPE_UNSELECTED";
})(EventTypes || (EventTypes = {}));
//# sourceMappingURL=Event.js.map