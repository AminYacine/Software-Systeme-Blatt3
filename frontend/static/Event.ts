import {Shape} from "./types.js";


export class CanvasEvent {
    type: EventTypes;
    shapeType: ShapeTypes;
    shape: Shape;
    eventId: number;
    private static counter: number = 0;

    constructor(type: EventTypes, shapeType: ShapeTypes, shape: Shape) {
        this.type = type;
        this.shapeType = shapeType;
        this.shape = shape;
        // this.user = user;
        this.eventId = CanvasEvent.counter++;
    }

    copy(): CanvasEvent {
        console.log("in copy event", this);
        const copyEvent = new CanvasEvent(this.type, this.shapeType, this.shape.copyShape());
        copyEvent.eventId--;
        return copyEvent;
    }

}

export enum EventTypes {
    ShapeAdded = "SHAPE_ADDED",
    MovedToBackground = "MOVED_BACKGROUND",
    ShapeRemoved = "SHAPE_REMOVED",
    ShapeSelected = "SHAPE_SELECTED",
    ShapeUnselected = "SHAPE_UNSELECTED",
}

export enum ShapeTypes {
    Line = "Line",
    Rectangle = "Rectangle",
    Circle = "Circle",
    Triangle = "Triangle"
}