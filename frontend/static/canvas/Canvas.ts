import {Shape, ShapeManager} from "./types.js";
import {ToolArea} from "../models/ToolArea.js";
import {MenuApi} from "./menuApi.js";
import {Menu} from "./menu.js";
import {CanvasEvent} from "../models/CanvasEvent.js";
import {EventTypes} from "../enums/EventTypes.js";
import {ShapeTypes} from "../enums/ShapeTypes.js";
import {getClientId, sendCanvasEvent} from "../WebSocketService.js";
import {Circle, Line, Rectangle, Triangle} from "./Shapes.js";

export class Canvas implements ShapeManager {
    get backGroundShapes(): Map<string, Shape> {
        return this._backGroundShapes;
    }

    private ctx: CanvasRenderingContext2D;

    //Dom element to draw only the shape when it is being initially drawn
    private readonly creationCanvasDomElement: HTMLCanvasElement;

    //Dom element to draw every created shape
    private readonly backgroundCanvasDomElement: HTMLCanvasElement;

    //holds the current created shape with corresponding id
    private creationShapes: Map<string, Shape> = new Map();
    //holds every shape after being created
    private _backGroundShapes: Map<string, Shape> = new Map();
    //holds temporarily all the shapes that are clicked
    private shapesOnClickedPoint: Shape[] = [];
    //holds every selected shape
    private selectedShapes: Shape[] = [];
    blockedShapes: Shape[] = [];

    private readonly width: number;
    private readonly height: number;
    private readonly selectionColor = `rgb(0,0,255)`;
    private readonly blockedColor = 'rgb(255,0,0)';

    private readonly standardFillColor: string = "transparent";
    private readonly standardOutlineColor: string = "black";


    constructor(creationCanvasDomElement: HTMLCanvasElement, backgroundCanvasDomElement: HTMLCanvasElement, toolArea: ToolArea) {
        this.backgroundCanvasDomElement = backgroundCanvasDomElement;
        this.creationCanvasDomElement = creationCanvasDomElement;

        //sets the drawing context in the beginning to the creationCanvas because no shape has yet been drawn
        this.ctx = this.creationCanvasDomElement.getContext("2d");

        const {width, height} = this.creationCanvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;

        //every eventListener needs to be added to the canvas in the foreground in order to be recognised, thus the creationCanvas is used
        this.creationCanvasDomElement.addEventListener("mousemove",
            createMouseHandler("handleMouseMove"));
        this.creationCanvasDomElement.addEventListener("mousedown",
            createMouseHandler("handleMouseDown"));
        this.creationCanvasDomElement.addEventListener("mouseup",
            createMouseHandler("handleMouseUp"));
        this.creationCanvasDomElement.addEventListener("click",
            createMouseHandler("handleMouseClick"));

        this.creationCanvasDomElement.addEventListener("contextmenu", ev => {
            ev.preventDefault();
            const toolSelection = toolArea.getSelectedShape();
            if (toolSelection !== undefined) {
                if (toolSelection.label === "Selektion") {
                    let contextMenu: Menu = this.setupContextMenu();
                    contextMenu.show(ev.clientX, ev.clientY);
                }
            }
        });

        function createMouseHandler(methodName: string) {
            return function (e) {
                e = e || window.event;

                if ('object' === typeof e) {
                    const
                        x = e.clientX - backgroundCanvasDomElement.offsetLeft,
                        y = e.clientY - backgroundCanvasDomElement.offsetTop,
                        ss = toolArea.getSelectedShape();
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y, e);
                    }
                }
            }
        }
    }

    /**
     * method to draw in the creationCanvas
     */
    drawCreationCanvas(): this {
        this.setContextToCreationCanvas();
        this.ctx.beginPath();
        //used to reset the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // draw creation shape
        this.creationShapes.forEach((shape) => {
            let isSelected = false;

            for (let selectedShape of this.selectedShapes) {
                if (shape.id === selectedShape.id) {
                    isSelected = true;
                    break;
                }
            }
            this.setCtxStandardState();
            shape.draw(this.ctx, isSelected, this.selectionColor);
        });
        return this;
    }

    /**
     * method to draw in the backgroundCanvas
     */
    drawBackground() {
        let markingColor;
        this.setContextToBackgroundCanvas();
        this.ctx.beginPath();
        //used to reset the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        //checks if shape is selected and sets color appropriately
        this._backGroundShapes.forEach((shape) => {
            let isSelectedOrBlocked = false;

            for (let selectedShape of this.selectedShapes) {
                if (shape.id === selectedShape.id) {
                    isSelectedOrBlocked = true;
                    markingColor = this.selectionColor;
                    break;
                }
            }
            //checks if shape is blocked and sets color appropriately
            if (!isSelectedOrBlocked) {
                for (let blockedShape of this.blockedShapes) {
                    if (shape.id == blockedShape.id) {
                        isSelectedOrBlocked = true;
                        markingColor = this.blockedColor;
                        break;
                    }
                }
            }
            //draw background shapes
            this.setCtxStandardState();
            shape.draw(this.ctx, isSelectedOrBlocked, markingColor);
        });
    }

    addShape(shape: Shape, shapeFinished: boolean, needsSelection: boolean) {

        //if the shape is finished, it will be added to the backgroundShapes and the creationCanvas will be reset
        if (shapeFinished) {

            //re-selects the moved shape
            if (needsSelection) {
                this.selectedShapes.push(shape);
            }

            this.creationShapes.clear();
            this.drawCreationCanvas();
            this.sendEvent(new CanvasEvent(EventTypes.ShapeAdded, Canvas.getShapeType(shape), shape));
        }
        // if the shape is not yet finished, it will be added to the creationShapes and the creationCanvas will be redrawn
        else {
            this.creationShapes.clear();
            this.creationShapes.set(shape.id, shape);
            this.drawCreationCanvas();
        }
    }


    makeShapeTransparent(shape: Shape) {
        const backgroundShape = this._backGroundShapes.get(shape.id)
        backgroundShape.setFillColor("transparent");
        backgroundShape.setOutlineColor("transparent");
        this.selectedShapes = [];
        this.drawBackground();
    }

    /**
     * Checks if only one shape is selected and if the mouse is over this exact shape.
     * If so the selected shape is returned
     * @param x x-position of mouse
     * @param y y-position of mouse
     */
    isShapeReadyToMove(x: number, y: number): Shape {
        if (this.selectedShapes.length === 1) {
            if (this.selectedShapes[0].isSelected(x, y)) {
                return this.selectedShapes[0];
            }
        }
        return undefined;
    }


    /**
     * Method to check if any shape is on the clicked position,
     * if so the shape wil be added to the shapesOnClickedPoint array
     */
    isShapeOnClickedPoint(x: number, y: number): boolean {
        this.shapesOnClickedPoint = [];
        let isShapeOnPoint: boolean = false;
        this._backGroundShapes.forEach((backgroundShape) => {
            if (backgroundShape.isSelected(x, y) && !this.isShapeBlocked(backgroundShape.id)) {
                this.shapesOnClickedPoint.push(backgroundShape);
                isShapeOnPoint = true;
            }
        });
        return isShapeOnPoint;
    }

    /**
     * Iterates through the shapesOnClickedPointArray and changes the shape
     * in the selectedShapes array
     */
    iterateShapes() {
        if (this.shapesOnClickedPoint.length > 0) {
            let index = this.shapesOnClickedPoint.indexOf(this.selectedShapes[0]);

            if (this.shapesOnClickedPoint.length - 1 > index) {
                //only send unselect if a shape is selected
                if (this.selectedShapes[0]) {
                    this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, Canvas.getShapeType(this.selectedShapes[0]), this.selectedShapes[0]));
                }
                this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, Canvas.getShapeType(this.shapesOnClickedPoint[index + 1]), this.shapesOnClickedPoint[index + 1]));
            } else {
                //only handle selection if the selected shape and the shapeOnClick are different
                if (this.selectedShapes[0] !== this.shapesOnClickedPoint[0]) {
                    //only send unselect if a shape is selected
                    if (this.selectedShapes[0]) {
                        this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, Canvas.getShapeType(this.selectedShapes[0]), this.selectedShapes[0]));
                    }
                    this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, Canvas.getShapeType(this.shapesOnClickedPoint[0]), this.shapesOnClickedPoint[0]));
                }
            }
        }
    }

    /**
     * Adds the first shape in the shapesOnClickedPoint array to the selectedShape array.
     * Before adding the shape, the array is cleared thus, only one shape is selected
     */
    selectShape() {
        this.selectedShapes.forEach(shape => {
            this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, Canvas.getShapeType(shape), shape));
        });
        if (this.shapesOnClickedPoint.length > 0) {
            this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, Canvas.getShapeType(this.shapesOnClickedPoint[0]), this.shapesOnClickedPoint[0]));
        }
    }

    /**
     * Adds the first shape in the shapesOnClickedPoint array to the selectedShape array.
     * The array is not reset before adding the shape, thus multiple shapes can be selected.
     */
    selectShapes() {
        if (this.shapesOnClickedPoint.length > 0) {
            if (!this.selectedShapes.includes(this.shapesOnClickedPoint[0])) {
                this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, Canvas.getShapeType(this.shapesOnClickedPoint[0]), this.shapesOnClickedPoint[0]));
            }
        }
    }

    /**
     * creates and returns the context menu
     */
    setupContextMenu(): Menu {
        let currentFillColor = this.standardFillColor;
        let currentOutlineColor = this.standardOutlineColor;

        // If none or more than one shape is selected or no fill- and outline-color is set in the shape
        // the pre-selection of the options will be the defined standards.
        // Otherwise, the fill and border color of the selected shape will be marked in the radio options

        if (this.selectedShapes.length < 2 && this.selectedShapes[0] != undefined) {
            if (this.selectedShapes[0].fillColor != undefined)
                currentFillColor = this.selectedShapes[0].fillColor;
            if (this.selectedShapes[0].strokeColor != undefined)
                currentOutlineColor = this.selectedShapes[0].strokeColor;
        }

        let menu = MenuApi.createMenu();
        let deleteItem = MenuApi.createItem("Delete", () => {
            this.selectedShapes.forEach((shape) => {
                this.sendEvent(new CanvasEvent(EventTypes.ShapeRemoved, Canvas.getShapeType(shape), shape));
            });
        });

        const moveForeGroundItem = MenuApi.createItem("To Foreground", () => {
            if (this.selectedShapes.length == 1) {
                this.changeShapeOrder(true);
            }
        });
        const moveToBackGroundItem = MenuApi.createItem("To Background", () => {
            if (this.selectedShapes.length == 1) {
                this.changeShapeOrder(false);
            }
        });

        let radioColorOption = MenuApi.createRadioOption(
            "Background color",
            {"transparent": "transparent", "red": "rot", "green": "grün", "blue": "blau", "black": "schwarz"},
            currentFillColor,
            this,
            true,
        );
        let radioLineOption = MenuApi.createRadioOption(
            "Outline color",
            {"red": "rot", "green": "grün", "blue": "blau", "black": "schwarz"},
            currentOutlineColor,
            this,
            false,
        );

        let sep1 = MenuApi.createSeparator();
        let sep2 = MenuApi.createSeparator();
        let sep3 = MenuApi.createSeparator();
        let sep4 = MenuApi.createSeparator();


        menu.addItem(deleteItem);
        menu.addItem(sep1);
        menu.addItem(radioColorOption);
        menu.addItem(sep2);
        menu.addItem(radioLineOption);
        menu.addItem(sep3);
        menu.addItem(moveForeGroundItem);
        menu.addItem(sep4);
        menu.addItem(moveToBackGroundItem);
        return menu;
    }

    /**
     * Moves the selected shape either in the foreground or background
     * @param toForeGround indicates if the selected shape should be moved into the back or foreground
     * @private
     */
    private changeShapeOrder(toForeGround: boolean) {
        const shapeToMove: Shape = this.selectedShapes[0];

        // selected shape is deleted from the map so the position can be changed
        this.sendEvent(new CanvasEvent(EventTypes.ShapeRemoved, Canvas.getShapeType(shapeToMove), shapeToMove));
        //added to selected shapes because after delete shape is removed from selected shapes
        if (toForeGround) {
            this.sendEvent(new CanvasEvent(EventTypes.ShapeAdded, Canvas.getShapeType(shapeToMove), shapeToMove));
        } else {
            this.sendEvent(new CanvasEvent(EventTypes.MovedToBackground, Canvas.getShapeType(shapeToMove), shapeToMove));
        }
        this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, Canvas.getShapeType(shapeToMove), shapeToMove));
    }

    /**
     * method to save a standard state for the drawing context
     * @private
     */
    private setCtxStandardState() {
        this.ctx.fillStyle = this.standardFillColor;
        this.ctx.strokeStyle = this.standardOutlineColor;
        this.ctx.save();
    }

    /**
     * method to set the drawing context to the creation canvas
     * @private
     */
    private setContextToCreationCanvas() {
        this.ctx = this.creationCanvasDomElement.getContext("2d");
    }

    /**
     * method to set the drawing context to the background canvas
     * @private
     */
    private setContextToBackgroundCanvas() {
        this.ctx = this.backgroundCanvasDomElement.getContext("2d");
    }


    /**
     * method to add an event to the stream
     * @param event
     */
    sendEvent(event: CanvasEvent) {
        sendCanvasEvent(event);
        this.handleEvent(event, getClientId());
    }

    /**
     * method that handles incoming events from the socket instance
     * @param event received CanvasEvent
     * @param userId userId of the incoming event
     */
    handleEvent(event: CanvasEvent, userId: number) {
        const fromCurrentUser: boolean = userId === getClientId();
        let eventShape: Shape = event.shape;
        console.log(eventShape.id)
        //only needs to generate new instance if event is not from current user
        eventShape = Canvas.getSpecificShape(event);

        switch (event.type) {

            case EventTypes.ShapeRemoved: {
                this._backGroundShapes.delete(eventShape.id);
                this.selectedShapes = this.selectedShapes.filter(shape => shape.id !== eventShape.id);
                this.blockedShapes = this.blockedShapes.filter(shape => shape.id !== eventShape.id);
                break;
            }
            case EventTypes.ShapeAdded: {
                this._backGroundShapes.set(eventShape.id, eventShape);
                break;
            }
            case EventTypes.MovedToBackground: {
                // two maps are combined, with the first having the shape that should be at the start
                // and the second being the shapes map holding the rest of the shapes.
                const helperMap: Map<string, Shape> = new Map();
                helperMap.set(eventShape.id, eventShape);
                this._backGroundShapes = new Map([...helperMap, ...this._backGroundShapes]);
                break;
            }
            case EventTypes.ShapeUnselected: {
                const shape = this._backGroundShapes.get(eventShape.id);
                if (shape !== undefined) {
                    if (fromCurrentUser) {
                        this.selectedShapes = this.selectedShapes.filter(shape => shape.id !== eventShape.id);
                        console.log("unselected")
                    } else {
                        this.blockedShapes = this.blockedShapes.filter(shape => shape.id !== eventShape.id);
                    }
                }
                break;
            }
            case EventTypes.ShapeSelected: {
                const shape = this._backGroundShapes.get(eventShape.id);
                if (shape !== undefined) {
                    //if the current user has selected a shape it will be pushed to the selected shapes, else it will be
                    // blocked for selection
                    if (fromCurrentUser) {
                        this.selectedShapes.push(shape);
                        console.log("selected")
                    } else {
                        this.blockedShapes.push(shape);
                    }
                }
                break;
            }
        }
        this.drawBackground();
    }


    private static getSpecificShape(event: CanvasEvent) {
        switch (event.shapeType) {
            case ShapeTypes.Line : {
                return Line.fromJSON(JSON.stringify(event.shape));
            }
            case ShapeTypes.Rectangle : {
                return Rectangle.fromJSON(JSON.stringify(event.shape));
            }
            case ShapeTypes.Circle : {
                return Circle.fromJSON(JSON.stringify(event.shape));
            }
            case ShapeTypes.Triangle : {
                return Triangle.fromJSON(JSON.stringify(event.shape));
            }
        }
    }

    private isShapeBlocked(shapeId: string): boolean {
        for (let blockedShape of this.blockedShapes) {
            if (blockedShape.id === shapeId) {
                console.log("shape blocked", shapeId)
                return true;
            }
        }
        return false;
    }

    static getShapeType(shape: Shape) {
        if (shape instanceof Line) {
            return ShapeTypes.Line;
        } else if (shape instanceof Rectangle) {
            return ShapeTypes.Rectangle;
        } else if (shape instanceof Circle) {
            return ShapeTypes.Circle;
        } else if (shape instanceof Triangle) {
            return ShapeTypes.Triangle;
        }
    }
}

