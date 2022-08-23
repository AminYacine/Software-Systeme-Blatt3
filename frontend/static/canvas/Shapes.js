import { getClientId } from "../websocket/WebSocketService.js";
export class Point2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static newPoint(point) {
        return new Point2D(point.x, point.y);
    }
    add(point) {
        if (point) {
            return new Point2D(this.x + point.x, this.y + point.y);
        }
        return new Point2D(this.x, this.y);
    }
}
class AbstractShape {
    constructor(specificId) {
        if (specificId) {
            this.id = specificId;
        }
        else {
            this.id = `${getClientId()}id${AbstractShape.counter++}`;
            // this.id = AbstractShape.counter++;
        }
    }
    setFillColor(color) {
        this.fillColor = color;
    }
    setOutlineColor(color) {
        this.strokeColor = color;
    }
}
AbstractShape.counter = 0;
class AbstractFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
    }
    handleMouseDown(x, y) {
        this.from = new Point2D(x, y);
    }
    handleMouseUp(x, y) {
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x, y)), true);
        this.from = undefined;
    }
    handleMouseMove(x, y) {
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
export class SelectionFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Selektion";
    }
    handleMouseDown(x, y, e) {
        if (e.ctrlKey || e.altKey) {
        }
        else {
            this.oldShape = this.shapeManager.isShapeReadyToMove(x, y);
            if (this.oldShape) {
                this.legacyShapeId = this.oldShape.id;
                this.isShapeReadyToMove = true;
                this.lastMousePos = new Point2D(x, y);
            }
        }
    }
    handleMouseMove(x, y) {
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
    handleMouseUp(x, y, e) {
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
    handleMouseClick(x, y, e) {
        if (this.isShapeReadyToMove) {
            this.isShapeReadyToMove = false;
        }
        else {
            this.shapeManager.isShapeOnClickedPoint(x, y);
            if (e.ctrlKey) {
                this.shapeManager.selectShapes();
            }
            else if (e.altKey) {
                this.shapeManager.iterateShapes();
            }
            else {
                this.shapeManager.selectShape();
            }
        }
    }
}
export class Line extends AbstractShape {
    constructor(from, to, specificId) {
        super(specificId);
        this.from = from;
        this.to = to;
        // toleration of 10 for mouse click
        this.selectToleration = 10;
    }
    copyShape(positionMovement) {
        const newLine = new Line(this.from.add(positionMovement), this.to.add(positionMovement), this.id);
        newLine.setFillColor(this.fillColor);
        newLine.setOutlineColor((this.strokeColor));
        return newLine;
    }
    static fromJSON(serialized) {
        const line = JSON.parse(serialized);
        const newLine = new Line(Point2D.newPoint(line.from), Point2D.newPoint(line.to), line.id);
        if (line.strokeColor !== undefined) {
            newLine.setOutlineColor(line.strokeColor);
        }
        return newLine;
    }
    draw(ctx, isSelected, selectionColor) {
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = this.strokeColor;
        ctx.stroke();
        if (isSelected) {
            ctx.fillStyle = selectionColor;
            ctx.fillRect(this.from.x - 3, this.from.y - 3, 6, 6);
            ctx.fillRect(this.to.x - 3, this.to.y - 3, 6, 6);
        }
    }
    isSelected(x, y) {
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
        }
        else if (parameter > 1) {
            xx = this.to.x;
            yy = this.to.y;
        }
        else {
            xx = this.from.x + parameter * c;
            yy = this.from.y + parameter * d;
        }
        let dx = x - xx;
        let dy = y - yy;
        let number = Math.sqrt(dx * dx + dy * dy);
        return number < this.selectToleration;
    }
}
export class LineFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Linie";
    }
    createShape(from, to) {
        return new Line(from, to);
    }
    handleMouseClick(x, y, e) {
    }
}
export class Circle extends AbstractShape {
    constructor(center, radius, specificId) {
        super(specificId);
        this.center = center;
        this.radius = radius;
    }
    copyShape(positionMovement) {
        const newCircle = new Circle(this.center.add(positionMovement), this.radius, this.id);
        newCircle.setFillColor(this.fillColor);
        newCircle.setOutlineColor(this.strokeColor);
        return newCircle;
    }
    static fromJSON(serialized) {
        const circle = JSON.parse(serialized);
        const newCircle = new Circle(Point2D.newPoint(circle.center), circle.radius, circle.id);
        if (circle.strokeColor !== undefined) {
            newCircle.setOutlineColor(circle.strokeColor);
        }
        if (circle.fillColor !== undefined) {
            newCircle.setFillColor(circle.fillColor);
        }
        return newCircle;
    }
    draw(ctx, isSelected, selectionColor) {
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
    isSelected(x, y) {
        let distanceSqr = Math.pow(this.center.x - x, 2) + Math.pow(this.center.y - y, 2);
        //true if the distance between the click and the center is less than the radius
        return distanceSqr < Math.pow(this.radius, 2);
    }
}
export class CircleFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Kreis";
    }
    createShape(from, to) {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    }
    static computeRadius(from, x, y) {
        const xDiff = (from.x - x), yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }
    handleMouseClick(x, y, e) {
    }
}
export class Rectangle extends AbstractShape {
    constructor(from, to, specificId) {
        super(specificId);
        this.from = from;
        this.to = to;
    }
    copyShape(positionMovement) {
        const newRectangle = new Rectangle(this.from.add(positionMovement), this.to.add(positionMovement), this.id);
        if (this.strokeColor) {
            newRectangle.setOutlineColor(this.strokeColor);
        }
        if (this.fillColor) {
            newRectangle.setFillColor(this.fillColor);
        }
        return newRectangle;
    }
    static fromJSON(serialized) {
        const rec = JSON.parse(serialized);
        const newRec = new Rectangle(Point2D.newPoint(rec.from), Point2D.newPoint(rec.to), rec.id);
        if (rec.strokeColor !== undefined) {
            newRec.setOutlineColor(rec.strokeColor);
        }
        if (rec.fillColor !== undefined) {
            newRec.setFillColor(rec.fillColor);
        }
        return newRec;
    }
    draw(ctx, isSelected, selectionColor) {
        ctx.beginPath();
        ctx.rect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
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
    isSelected(x, y) {
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
export class RectangleFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Rechteck";
    }
    createShape(from, to) {
        return new Rectangle(from, to);
    }
    handleMouseClick(x, y, e) {
    }
}
export class Triangle extends AbstractShape {
    constructor(p1, p2, p3, specificId) {
        super(specificId);
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }
    copyShape(positionMovement) {
        const newTriangle = new Triangle(this.p1.add(positionMovement), this.p2.add(positionMovement), this.p3.add(positionMovement), this.id);
        newTriangle.setFillColor(this.fillColor);
        newTriangle.setOutlineColor((this.strokeColor));
        return newTriangle;
    }
    static fromJSON(serialized) {
        const triangle = JSON.parse(serialized);
        const newTriangle = new Triangle(Point2D.newPoint(triangle.p1), Point2D.newPoint(triangle.p2), Point2D.newPoint(triangle.p3), triangle.id);
        if (triangle.strokeColor !== undefined) {
            newTriangle.setOutlineColor(triangle.strokeColor);
        }
        if (triangle.fillColor !== undefined) {
            newTriangle.setFillColor(triangle.fillColor);
        }
        return newTriangle;
    }
    draw(ctx, isSelected, selectionColor) {
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
    isSelected(x, y) {
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
export class TriangleFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Dreieck";
    }
    handleMouseDown(x, y) {
        if (this.tmpShape) {
            this.shapeManager.addShape(new Triangle(this.from, this.tmpTo, new Point2D(x, y)), true);
            this.from = undefined;
            this.tmpTo = undefined;
            this.tmpLine = undefined;
            this.thirdPoint = undefined;
            this.tmpShape = undefined;
        }
        else {
            this.from = new Point2D(x, y);
        }
    }
    handleMouseUp(x, y) {
        // remove the temp line, if there was one
        if (this.tmpLine) {
            this.tmpLine = undefined;
            this.tmpTo = new Point2D(x, y);
            this.thirdPoint = new Point2D(x, y);
            this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
            this.shapeManager.addShape(this.tmpShape, false);
        }
    }
    handleMouseMove(x, y) {
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
        }
        else { // no second point fixed, update tmp line
            if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
                this.tmpTo = new Point2D(x, y);
                // adds a new temp line
                this.tmpLine = new Line(this.from, this.tmpTo);
                this.shapeManager.addShape(this.tmpLine, false);
            }
        }
    }
    handleMouseClick(x, y, e) {
    }
}
//# sourceMappingURL=Shapes.js.map