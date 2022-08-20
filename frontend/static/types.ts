import {Point2D} from "./Shapes.js";

export interface Shape {
    readonly id: number;
    fillColor: string;
    strokeColor: string;

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean, selectionColor: string);

    /**
     * this function checks if this shape is on the specified x and y coordinate
     */
    isSelected(x: number, y: number): boolean;

    /**
     * sets the fill color of the shape and draws it
     */
    setFillColor(color: string);

    /**
     * sets the outline color of the shape and draws it
     */
    setOutlineColor(color: string);

    copyShape(positionMovement?: Point2D): Shape;

}

export interface ShapeManager {
    addShape(shape: Shape, shapeFinished: boolean, shapeMoved?: boolean);

    selectShape();

    selectShapes();

    iterateShapes();

    isShapeOnClickedPoint(x: number, y: number): boolean;

    isShapeReadyToMove(x: number, y: number): Shape;

    makeShapeTransparent(oldShape: Shape): void;


}

export interface ShapeFactory {
    label: string;

    handleMouseDown(x: number, y: number, e: MouseEvent);

    handleMouseUp(x: number, y: number, e: MouseEvent);

    handleMouseMove(x: number, y: number);

    handleMouseClick(x: number, y: number, e: MouseEvent);
}
