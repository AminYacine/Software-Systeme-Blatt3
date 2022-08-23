import {Shape} from "../canvas/types.js";
import {EventTypes} from "../enums/EventTypes.js";
import {ShapeTypes} from "../enums/ShapeTypes.js";


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
        this.eventId = CanvasEvent.counter++;
    }
}