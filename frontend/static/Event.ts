import {Shape} from "./types.js";

export class CanvasEvent {
    type: EventTypes;
    shape: Shape;
    user: number;
    private eventId: number;
    private static counter: number = 0;
    color?: string;

    constructor(type: EventTypes, shape: Shape, user: number, color?: string) {
        this.type = type;
        this.shape = shape;
        this.user = user;
        this.eventId = CanvasEvent.counter++;
        this.color = color;
    }

    copy(): CanvasEvent {
       const copyEvent = new CanvasEvent( this.type , this.shape.copyShape(), this.user, this.color);
       copyEvent.eventId --;
       return copyEvent;
    }

    incrementIdCounter() {
        CanvasEvent.counter++;
    }

    getId() {
        return this.eventId;
    }
}

export enum EventTypes {
    ShapeAdded = "SHAPE_ADDED",
    MovedToBackground = "MOVED_BACKGROUND",
    ShapeRemoved = "SHAPE_REMOVED",
    ShapeSelected = "SHAPE_SELECTED",
    ShapeUnselected = "SHAPE_UNSELECTED",
}