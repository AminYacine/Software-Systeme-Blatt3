import { CircleFactory, LineFactory, RectangleFactory, SelectionFactory, TriangleFactory } from "./Shapes.js";
import { ToolArea } from "./ToolArea.js";
import { Canvas } from "./Canvas.js";
export function init(wss) {
    const creationCanvasDomElm = document.getElementById("creationArea");
    const backGroundCanvasDomElm = document.getElementById("backgroundArea");
    const menu = document.getElementsByClassName("tools");
    const texInput = document.getElementById("eventInput");
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let canvas;
    const sm = {
        addShape(s, rd, mvd) {
            return canvas.addShape(s, rd, mvd);
        },
        isShapeOnClickedPoint(x, y) {
            return canvas.isShapeOnClickedPoint(x, y);
        },
        selectShape() {
            return canvas.selectShape();
        },
        selectShapes() {
            return canvas.selectShapes();
        },
        iterateShapes() {
            return canvas.iterateShapes();
        },
        isShapeReadyToMove(x, y) {
            return canvas.isShapeReadyToMove(x, y);
        },
        makeShapeTransparent(shape) {
            return canvas.makeShapeTransparent(shape);
        }
    };
    const shapesSelector = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new SelectionFactory(sm),
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(creationCanvasDomElm, backGroundCanvasDomElm, toolArea, texInput, wss);
    console.log("canvas from init", canvas);
}
//# sourceMappingURL=init.js.map