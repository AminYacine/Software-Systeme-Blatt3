import {Shape, ShapeFactory, ShapeManager} from "./types.js";
import {CircleFactory, LineFactory, RectangleFactory, SelectionFactory, TriangleFactory} from "./Shapes.js";
import {ToolArea} from "../models/ToolArea.js";
import {Canvas} from "./Canvas.js";
export function initCanvas(): Canvas {
    const creationCanvasDomElm = document.getElementById("creationArea") as HTMLCanvasElement;
    const backGroundCanvasDomElm = document.getElementById("backgroundArea") as HTMLCanvasElement;
    const menu = document.getElementsByClassName("tools");
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let canvas: Canvas;
    const sm: ShapeManager = {
        addShape(s, rd, mvd) {
            return canvas.addShape(s,rd, mvd);
        },
        isShapeOnClickedPoint(x: number, y: number) {
            return canvas.isShapeOnClickedPoint(x,y);
        },
        selectShape() {
            return canvas.selectShape();
        },
        selectShapes(){
            return canvas.selectShapes();
        },
        iterateShapes(){
            return canvas.iterateShapes();
        },
        isShapeReadyToMove(x: number, y: number): Shape {
            return canvas.isShapeReadyToMove(x, y);
        },
        makeShapeTransparent(shape: Shape) {
            return canvas.makeShapeTransparent(shape);
        }

    };
    const shapesSelector: ShapeFactory[] = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new SelectionFactory(sm),
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
   return  canvas = new Canvas(creationCanvasDomElm, backGroundCanvasDomElm, toolArea);

}
