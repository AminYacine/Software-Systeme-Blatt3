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
export var EventTypes;
(function (EventTypes) {
    EventTypes["ShapeAdded"] = "SHAPE_ADDED";
    EventTypes["MovedToBackground"] = "MOVED_BACKGROUND";
    EventTypes["ShapeRemoved"] = "SHAPE_REMOVED";
    EventTypes["ShapeSelected"] = "SHAPE_SELECTED";
    EventTypes["ShapeUnselected"] = "SHAPE_UNSELECTED";
})(EventTypes || (EventTypes = {}));
export var ShapeTypes;
(function (ShapeTypes) {
    ShapeTypes["Line"] = "Line";
    ShapeTypes["Rectangle"] = "Rectangle";
    ShapeTypes["Circle"] = "Circle";
    ShapeTypes["Triangle"] = "Triangle";
})(ShapeTypes || (ShapeTypes = {}));
//# sourceMappingURL=Event.js.map