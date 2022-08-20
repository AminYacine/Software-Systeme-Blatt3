import {Shape} from "./types.js";


export class CanvasEvent {
    type: EventTypes;
    shapeType: string;
    shape: Shape;
    // user: number;
    eventId: number;
    private static counter: number = 0;
    color?: string;

    constructor(type: EventTypes, shapeType: string, shape: Shape, color?: string) {
        this.type = type;
        this.shapeType = shapeType;
        this.shape = shape;
        // this.user = user;
        this.eventId = CanvasEvent.counter++;
        this.color = color;
    }

    copy(): CanvasEvent {
       const copyEvent = new CanvasEvent( this.type, this.shapeType, this.shape.copyShape(), this.color);
       copyEvent.eventId --;
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