import {Shape, ShapeFactory, ShapeManager} from "./types.js";
import {getClientId} from "../WebSocketService.js";

export class Point2D {
    constructor(readonly x: number, readonly y: number) {
    }

    static newPoint(point: Point2D) {
        return new Point2D(point.x, point.y);
    }

    add(point?: Point2D): Point2D {
        if (point) {
            return new Point2D(this.x + point.x, this.y + point.y);
        }
        return new Point2D(this.x, this.y);
    }
}

class AbstractShape {
    private static counter: number = 0;
    readonly id: string;
    fillColor: string;
    strokeColor: string;

    constructor(specificId?: string) {
        if (specificId) {
            this.id = specificId;
        } else {
            this.id = `${getClientId()}id${AbstractShape.counter++}`;
            // this.id = AbstractShape.counter++;
        }
    }

    setFillColor(color: string) {
        this.fillColor = color;
    }

    setOutlineColor(color: string) {
        this.strokeColor = color;
    }
}

abstract class AbstractFactory<T extends Shape> {
    private from: Point2D;
    private tmpTo: Point2D;
    private tmpShape: T;

    protected constructor(readonly shapeManager: ShapeManager) {
    }

    abstract createShape(from: Point2D, to: Point2D): T;

    handleMouseDown(x: number, y: number) {
        this.from = new Point2D(x, y);
    }

    handleMouseUp(x: number, y: number) {
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x, y)), true);
        this.from = undefined;
    }

    handleMouseMove(x: number, y: number) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }
        if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
            this.tmpTo = new Point2D(x, y);

            // adds a new temp line
            this.tmpShape = this.createShape(this.from, new Point2D(x, y));
            this.shapeManager.addShape(this.tmpShape, false);
        }
    }

}

export class SelectionFactory implements ShapeFactory {
    public label: string = "Selektion";
    private isShapeReadyToMove: boolean;
    private isShapeBeingMoved: boolean;
    private oldShape: Shape;
    private newShape: Shape;
    private lastMousePos: Point2D;
    private legacyShapeId: string;

    constructor(readonly shapeManager: ShapeManager) {
    }

    handleMouseDown(x: number, y: number, e: MouseEvent) {
        if (e.ctrlKey || e.altKey) {
        } else {
            this.oldShape = this.shapeManager.isShapeReadyToMove(x, y);
            if (this.oldShape) {
                this.legacyShapeId = this.oldShape.id;
                this.isShapeReadyToMove = true;
                this.lastMousePos = new Point2D(x, y);
            }
        }

    }

    handleMouseMove(x: number, y: number) {
        if (this.isShapeReadyToMove) {
            this.isShapeBeingMoved = true;
            // calculates the x and y movement of the mouse
            const mouseMove = new Point2D(x - this.lastMousePos.x, y - this.lastMousePos.y);

            let shape = this.oldShape.copyShape(mouseMove);
            // new Line(
            // new Point2D(this.oldShape.from.x + mouseMove.x, this.oldShape.from.y + mouseMove.y),
            // new Point2D(this.oldShape.to.x + mouseMove.x, this.oldShape.to.y + mouseMove.y)
            // );


            // if the shape is moved for the first time, the shape in the background is made transparent
            if (!this.newShape) {

                this.shapeManager.makeShapeTransparent(this.oldShape);
            }
            this.newShape = shape;
            this.shapeManager.addShape(shape, false);
            this.oldShape = this.newShape;
            this.lastMousePos = new Point2D(x, y);
        }
    }

    handleMouseUp(x: number, y: number, e: MouseEvent) {
        if (e.ctrlKey || e.altKey) {
        }
        if (this.isShapeReadyToMove) {
            if (this.isShapeBeingMoved) {
                this.isShapeBeingMoved = false;
                //adds the last shape to the background
                this.shapeManager.addShape(this.oldShape, true, true);

                this.oldShape = undefined;
                this.newShape = undefined;
                this.lastMousePos = undefined;
            }
        }
    }

    /**
     * Handles mouse click when the selection item is chosen.
     * The function calls for each scenario is implemented in the Canvas class
     */
    handleMouseClick(x: number, y: number, e: MouseEvent) {
        if (this.isShapeReadyToMove) {
            this.isShapeReadyToMove = false;
        } else {
            this.shapeManager.isShapeOnClickedPoint(x, y);
            if (e.ctrlKey) {
                this.shapeManager.selectShapes();
            } else if (e.altKey) {
                this.shapeManager.iterateShapes();
            } else {
                this.shapeManager.selectShape();
            }
        }
    }

}

export class Line extends AbstractShape implements Shape {
    // toleration of 10 for mouse click
    selectToleration: number = 10;

    constructor(readonly from: Point2D, readonly to: Point2D, specificId?: string) {
        super(specificId);
    }

    copyShape(positionMovement?: Point2D) {
        const newLine = new Line(
            this.from.add(positionMovement),
            this.to.add(positionMovement),
            this.id
        );
        newLine.setFillColor(this.fillColor);
        newLine.setOutlineColor((this.strokeColor));
        return newLine;
    }

    static fromJSON(serialized: string): Line {
        const line: Line = JSON.parse(serialized);
        const newLine = new Line(
            Point2D.newPoint(line.from),
            Point2D.newPoint(line.to),
            line.id
        )
        if (line.strokeColor !== undefined) {
            newLine.setOutlineColor(line.strokeColor);
        }
        return newLine;
    }

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean, selectionColor: string,) {

        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = this.strokeColor;
        ctx.stroke();

        if (isSelected) {
            ctx.fillStyle = selectionColor;
            ctx.fillRect(this.from.x - 3, this.from.y - 3, 6, 6);
            ctx.fillRect(this.to.x - 3, this.to.y - 3, 6, 6)
        }
    }

    isSelected(x: number, y: number): boolean {
        //solution for calculating shortest distance between clicked point and a line was implemented after this blog post
        // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment

        let a = x - this.from.x;
        let b = y - this.from.y;
        let c = this.to.x - this.from.x;
        let d = this.to.y - this.from.y;

        let dot = a * c + b * d;
        let length_sqr = c * c + d * d;
        let parameter = -1;
        if (length_sqr != 0)
            parameter = dot / length_sqr;

        let xx, yy;

        if (parameter < 0) {
            xx = this.from.x;
            yy = this.from.y;
        } else if (parameter > 1) {
            xx = this.to.x;
            yy = this.to.y;
        } else {
            xx = this.from.x + parameter * c;
            yy = this.from.y + parameter * d;
        }

        let dx = x - xx;
        let dy = y - yy;

        let number = Math.sqrt(dx * dx + dy * dy);

        return number < this.selectToleration;
    }
}

export class LineFactory extends AbstractFactory<Line> implements ShapeFactory {

    public label: string = "Linie";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Line {
        return new Line(from, to);
    }

    handleMouseClick(x: number, y: number, e: MouseEvent) {
    }
}


export class Circle extends AbstractShape implements Shape {
    constructor(readonly center: Point2D, readonly radius: number, specificId?: string) {
        super(specificId);
    }

    copyShape(positionMovement?: Point2D) {
        const newCircle = new Circle(
            this.center.add(positionMovement),
            this.radius,
            this.id
        );
        newCircle.setFillColor(this.fillColor);
        newCircle.setOutlineColor(this.strokeColor);
        return newCircle;
    }

    static fromJSON(serialized: string): Circle {
        const circle: Circle = JSON.parse(serialized);
        const newCircle = new Circle(
            Point2D.newPoint(circle.center),
            circle.radius,
            circle.id
        );
        if (circle.strokeColor !== undefined) {
            newCircle.setOutlineColor(circle.strokeColor);
        }
        if (circle.fillColor !== undefined) {
            newCircle.setFillColor(circle.fillColor);
        }
        return newCircle;
    }

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean, selectionColor: string) {

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        // for every shape the fill and selection color has to be set before ctx.fill() and ctx.stroke() is called
        // these function calls will then fill and outline the last drawn shape
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        ctx.fill();
        ctx.stroke();

        // Every shape checks if it is selected. If so rectangles will be additionally drawn
        // to specific positions of the shape in the specified color.
        if (isSelected) {
            ctx.fillStyle = selectionColor;
            ctx.fillRect(this.center.x - (this.radius + 3), this.center.y, 6, 6);
            ctx.fillRect(this.center.x, this.center.y - (this.radius + 3), 6, 6);
            ctx.fillRect(this.center.x + (this.radius - 3), this.center.y, 6, 6);
            ctx.fillRect(this.center.x, this.center.y + (this.radius - 3), 6, 6);
        }
    }

    isSelected(x: number, y: number): boolean {

        let distanceSqr = Math.pow(this.center.x - x, 2) + Math.pow(this.center.y - y, 2);
        //true if the distance between the click and the center is less than the radius
        return distanceSqr < Math.pow(this.radius, 2);
    }
}

export class CircleFactory extends AbstractFactory<Circle> implements ShapeFactory {
    public label: string = "Kreis";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Circle {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    }

    static computeRadius(from: Point2D, x: number, y: number): number {
        const xDiff = (from.x - x),
            yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }

    handleMouseClick(x: number, y: number, e: MouseEvent) {
    }
}


export class Rectangle extends AbstractShape implements Shape {
    constructor(readonly from: Point2D, readonly to: Point2D, specificId?: string) {
        super(specificId);
    }

    copyShape(positionMovement?: Point2D) {
        const newRectangle = new Rectangle(
            this.from.add(positionMovement),
            this.to.add(positionMovement),
            this.id
        );
        if (this.strokeColor) {
            newRectangle.setOutlineColor(this.strokeColor);
        }
        if (this.fillColor) {
            newRectangle.setFillColor(this.fillColor);
        }
        return newRectangle;
    }

    static fromJSON(serialized: string): Rectangle {
        const rec: Rectangle = JSON.parse(serialized);
        const newRec = new Rectangle(
            Point2D.newPoint(rec.from),
            Point2D.newPoint(rec.to),
            rec.id
        );
        if (rec.strokeColor !== undefined) {
            newRec.setOutlineColor(rec.strokeColor);
        }
        if (rec.fillColor !== undefined) {
            newRec.setFillColor(rec.fillColor);
        }
        return newRec;
    }

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean, selectionColor: string) {
        ctx.beginPath();
        ctx.rect(this.from.x, this.from.y,
            this.to.x - this.from.x, this.to.y - this.from.y);
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        ctx.fill();
        ctx.stroke();

        if (isSelected) {
            ctx.fillStyle = selectionColor;
            ctx.fillRect(this.from.x - 3, this.from.y - 3, 6, 6);
            ctx.fillRect(this.to.x - 3, this.from.y - 3, 6, 6);
            ctx.fillRect(this.to.x - 3, this.to.y - 3, 6, 6);
            ctx.fillRect(this.from.x - 3, this.to.y - 3, 6, 6);
        }
    }

    isSelected(x: number, y: number): boolean {
        // when drawn from left to right
        if (this.from.x < this.to.x) {
            if (x < this.from.x || x > this.to.x) {
                return false;
            }
            //when drawn from top to bottom
            if (this.from.y < this.to.y) {
                return !(y < this.from.y || y > this.to.y);
            }
            //when drawn from bottom to top
            else {
                return !(y > this.from.y || y < this.to.y);
            }
        }
        // when drawn from right to left
        else {
            if (x > this.from.x || x < this.to.x) {
                return false;
            }
            //when drawn from top to bottom
            if (this.from.y < this.to.y) {
                return !(y < this.from.y || y > this.to.y);
            }
            //when drawn from bottom to top
            else {
                return !(y > this.from.y || y < this.to.y);
            }
        }

    }
}

export class RectangleFactory extends AbstractFactory<Rectangle> implements ShapeFactory {
    public label: string = "Rechteck";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Rectangle {
        return new Rectangle(from, to);
    }

    handleMouseClick(x: number, y: number, e: MouseEvent) {
    }
}


export class Triangle extends AbstractShape implements Shape {
    constructor(readonly p1: Point2D, readonly p2: Point2D, readonly p3: Point2D, specificId?: string) {
        super(specificId);
    }

    copyShape(positionMovement?: Point2D) {
        const newTriangle = new Triangle(
            this.p1.add(positionMovement),
            this.p2.add(positionMovement),
            this.p3.add(positionMovement),
            this.id
        );
        newTriangle.setFillColor(this.fillColor);
        newTriangle.setOutlineColor((this.strokeColor));
        return newTriangle;
    }

    static fromJSON(serialized: string): Triangle {
        const triangle: Triangle = JSON.parse(serialized);
        const newTriangle = new Triangle(
            Point2D.newPoint(triangle.p1),
            Point2D.newPoint(triangle.p2),
            Point2D.newPoint(triangle.p3),
            triangle.id
        );
        if (triangle.strokeColor !== undefined) {
            newTriangle.setOutlineColor(triangle.strokeColor);
        }
        if (triangle.fillColor !== undefined) {
            newTriangle.setFillColor(triangle.fillColor);
        }
        return newTriangle;
    }

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean, selectionColor: string) {

        ctx.beginPath();
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        ctx.fill();
        ctx.stroke();

        if (isSelected) {
            ctx.fillStyle = selectionColor;
            ctx.fillRect(this.p1.x - 3, this.p1.y - 3, 6, 6);
            ctx.fillRect(this.p2.x - 3, this.p2.y - 3, 6, 6);
            ctx.fillRect(this.p3.x - 3, this.p3.y - 3, 6, 6);
        }
    }

    isSelected(x: number, y: number): boolean {
        //taken from stackoverflow https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle

        let v1, v2, v3;
        let negative, positive;

        v1 = check(x, y, this.p1, this.p2);
        v2 = check(x, y, this.p2, this.p3);
        v3 = check(x, y, this.p3, this.p1);

        negative = (v1 < 0) || (v2 < 0) || (v3 < 0);
        positive = (v1 > 0) || (v2 > 0) || (v3 > 0);

        return !(negative && positive);

        function check(x, y, p2, p3) {
            return (x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (y - p3.y);
        }
    }
}

export class TriangleFactory implements ShapeFactory {
    public label: string = "Dreieck";

    private from: Point2D;
    private tmpTo: Point2D;
    private tmpLine: Line;
    private thirdPoint: Point2D;
    private tmpShape: Triangle;

    constructor(readonly shapeManager: ShapeManager) {
    }

    handleMouseDown(x: number, y: number) {
        if (this.tmpShape) {
            this.shapeManager.addShape(new Triangle(this.from, this.tmpTo, new Point2D(x, y)), true);
            this.from = undefined;
            this.tmpTo = undefined;
            this.tmpLine = undefined;
            this.thirdPoint = undefined;
            this.tmpShape = undefined;
        } else {
            this.from = new Point2D(x, y);
        }
    }

    handleMouseUp(x: number, y: number) {
        // remove the temp line, if there was one
        if (this.tmpLine) {
            this.tmpLine = undefined;
            this.tmpTo = new Point2D(x, y);
            this.thirdPoint = new Point2D(x, y);
            this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
            this.shapeManager.addShape(this.tmpShape, false);
        }
    }

    handleMouseMove(x: number, y: number) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }

        if (this.tmpShape) { // second point already defined, update temp triangle
            if (!this.thirdPoint || (this.thirdPoint.x !== x || this.thirdPoint.y !== y)) {
                this.thirdPoint = new Point2D(x, y);

                // adds a new temp triangle
                this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
                this.shapeManager.addShape(this.tmpShape, false);
            }
        } else { // no second point fixed, update tmp line
            if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
                this.tmpTo = new Point2D(x, y);

                // adds a new temp line
                this.tmpLine = new Line(this.from, this.tmpTo);
                this.shapeManager.addShape(this.tmpLine, false);
            }
        }
    }

    handleMouseClick(x: number, y: number, e: MouseEvent) {
    }
}