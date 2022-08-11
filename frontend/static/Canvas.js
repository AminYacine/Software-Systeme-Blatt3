import { MenuApi } from "./menuApi.js";
import { CanvasEvent, EventTypes } from "./Event.js";
export class Canvas {
    constructor(creationCanvasDomElement, backgroundCanvasDomElement, toolArea, eventInput) {
        this.eventInput = eventInput;
        //holds the current created shape with corresponding id
        this.creationShapes = new Map();
        //holds every shape after being created
        this.backGroundShapes = new Map();
        //holds temporarily all the shapes that are clicked
        this.shapesOnClickedPoint = [];
        //holds every selected shape
        this.selectedShapes = [];
        this.eventStream = [];
        this.selectionColor = 'rgb(255,0,0)';
        this.standardFillColor = "transparent";
        this.standardOutlineColor = "black";
        this.backgroundCanvasDomElement = backgroundCanvasDomElement;
        this.creationCanvasDomElement = creationCanvasDomElement;
        //sets the drawing context in the beginning to the creationCanvas because no shape has yet been drawn
        this.ctx = this.creationCanvasDomElement.getContext("2d");
        const { width, height } = this.creationCanvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        //every eventListener needs to be added to the canvas in the foreground in order to be recognised, thus the creationCanvas is used
        this.creationCanvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        this.creationCanvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        this.creationCanvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        this.creationCanvasDomElement.addEventListener("click", createMouseHandler("handleMouseClick"));
        this.creationCanvasDomElement.addEventListener("contextmenu", ev => {
            ev.preventDefault();
            const toolSelection = toolArea.getSelectedShape();
            if (toolSelection !== undefined) {
                if (toolSelection.label === "Selektion") {
                    let contextMenu = this.setupContextMenu();
                    contextMenu.show(ev.clientX, ev.clientY);
                }
            }
        });
        function createMouseHandler(methodName) {
            return function (e) {
                e = e || window.event;
                if ('object' === typeof e) {
                    const x = e.clientX - backgroundCanvasDomElement.offsetLeft, y = e.clientY - backgroundCanvasDomElement.offsetTop, ss = toolArea.getSelectedShape();
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y, e);
                    }
                }
            };
        }
        const eventButton = document.getElementById("eventButton");
        eventButton.addEventListener("click", () => {
            this.handleNewEvent(eventInput.value);
        });
    }
    handleNewEvent(eventId) {
        const myEvent = this.eventStream.find(event => {
            return event.getId() === Number(eventId);
        });
        console.log("Found event:", myEvent);
        this.sendEvent(myEvent);
    }
    /**
     * method to draw in the creationCanvas
     */
    drawCreationCanvas() {
        this.setContextToCreationCanvas();
        this.ctx.beginPath();
        //used to reset the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        // draw creation shape
        this.creationShapes.forEach((shape) => {
            let isSelected = this.selectedShapes.includes(shape);
            this.setCtxStandardState();
            shape.draw(this.ctx, isSelected, this.selectionColor);
        });
        return this;
    }
    /**
     * method to draw in the backgroundCanvas
     */
    drawBackground() {
        this.setContextToBackgroundCanvas();
        this.ctx.beginPath();
        //used to reset the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        //draw background shapes
        this.backGroundShapes.forEach((shape) => {
            let isSelected = this.selectedShapes.includes(shape);
            this.setCtxStandardState();
            shape.draw(this.ctx, isSelected, this.selectionColor);
        });
    }
    addShape(shape, shapeFinished, shapeMoved) {
        //if the shape is finished, it will be added to the backgroundShapes and the creationCanvas will be reset
        if (shapeFinished) {
            //re-selects the moved shape
            if (shapeMoved) {
                this.selectedShapes.push(shape);
            }
            this.creationShapes.clear();
            this.drawCreationCanvas();
            this.sendEvent(new CanvasEvent(EventTypes.ShapeAdded, shape, 1));
        }
        // if the shape is not yet finished, it will be added to the creationShapes and the creationCanvas will be redrawn
        else {
            this.creationShapes.clear();
            this.creationShapes.set(shape.id, shape);
            this.drawCreationCanvas();
        }
    }
    makeShapeTransparent(shape) {
        const backgroundShape = this.backGroundShapes.get(shape.id);
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
    isShapeReadyToMove(x, y) {
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
    isShapeOnClickedPoint(x, y) {
        this.shapesOnClickedPoint = [];
        let isShapeOnPoint = false;
        this.backGroundShapes.forEach((value) => {
            if (value.isSelected(x, y)) {
                this.shapesOnClickedPoint.push(value);
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
                    this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, this.selectedShapes[0], 1));
                }
                this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, this.shapesOnClickedPoint[index + 1], 1));
            }
            else {
                //only handle selection if the selected shape and the shapeOnClick are different
                if (this.selectedShapes[0] !== this.shapesOnClickedPoint[0]) {
                    //only send unselect if a shape is selected
                    if (this.selectedShapes[0]) {
                        this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, this.selectedShapes[0], 1));
                    }
                    this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, this.shapesOnClickedPoint[0], 1));
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
            this.sendEvent(new CanvasEvent(EventTypes.ShapeUnselected, shape, 1));
        });
        if (this.shapesOnClickedPoint.length > 0) {
            this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, this.shapesOnClickedPoint[0], 1));
        }
    }
    /**
     * Adds the first shape in the shapesOnClickedPoint array to the selectedShape array.
     * The array is not reset before adding the shape, thus multiple shapes can be selected.
     */
    selectShapes() {
        if (this.shapesOnClickedPoint.length > 0) {
            // this.selectedShapes.push(this.shapesOnClickedPoint[0]);
            if (!this.selectedShapes.includes(this.shapesOnClickedPoint[0])) {
                this.sendEvent(new CanvasEvent(EventTypes.ShapeSelected, this.shapesOnClickedPoint[0], 1));
            }
        }
    }
    /**
     * creates and returns the context menu
     */
    setupContextMenu() {
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
                //todo add own clientId;
                this.sendEvent(new CanvasEvent(EventTypes.ShapeRemoved, shape, 1));
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
                this.drawBackground();
            }
        });
        let radioColorOption = MenuApi.createRadioOption("Background color", { "transparent": "transparent", "red": "rot", "green": "grün", "blue": "blau", "black": "schwarz" }, currentFillColor, this, true);
        let radioLineOption = MenuApi.createRadioOption("Outline color", { "red": "rot", "green": "grün", "blue": "blau", "black": "schwarz" }, currentOutlineColor, this, false);
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
    changeShapeOrder(toForeGround) {
        const shapeToMove = this.selectedShapes[0];
        const idToMove = shapeToMove.id;
        // selected shape is deleted from the map so the position can be changed
        this.sendEvent(new CanvasEvent(EventTypes.ShapeRemoved, shapeToMove, 1));
        if (toForeGround) {
            //add event moveToForeground
            this.sendEvent(new CanvasEvent(EventTypes.ShapeAdded, shapeToMove, 1));
        }
        else {
            //add event moveToBackground
            this.sendEvent(new CanvasEvent(EventTypes.MovedToBackground, shapeToMove, 1));
        }
    }
    /**
     * method to save a standard state for the drawing context
     * @private
     */
    setCtxStandardState() {
        this.ctx.fillStyle = this.standardFillColor;
        this.ctx.strokeStyle = this.standardOutlineColor;
        this.ctx.save();
    }
    /**
     * method to set the drawing context to the creation canvas
     * @private
     */
    setContextToCreationCanvas() {
        this.ctx = this.creationCanvasDomElement.getContext("2d");
    }
    /**
     * method to set the drawing context to the background canvas
     * @private
     */
    setContextToBackgroundCanvas() {
        this.ctx = this.backgroundCanvasDomElement.getContext("2d");
    }
    /**
     * method to add an event to the stream
     * @param event
     */
    sendEvent(event) {
        console.log("New Event:", event.type, event.getId(), event.shape);
        this.eventStream.push(event.copy());
        //todo send event to backend
        this.handleEvent(event);
    }
    /**
     * method that handles incoming events from the socket instance
     * @param event received CanvasEvent
     */
    handleEvent(event) {
        const eventShape = event.shape;
        switch (event.type) {
            case EventTypes.ShapeRemoved: {
                this.backGroundShapes.delete(event.shape.id);
                this.selectedShapes = this.selectedShapes.filter(shape => shape.id !== eventShape.id);
                break;
            }
            case EventTypes.ShapeAdded: {
                this.backGroundShapes.set(eventShape.id, eventShape);
                break;
            }
            case EventTypes.MovedToBackground: {
                // two maps are combined, with the first having the shape that should be at the start
                // and the second being the shapes map holding the rest of the shapes.
                const helperMap = new Map();
                helperMap.set(eventShape.id, eventShape);
                this.backGroundShapes = new Map([...helperMap, ...this.backGroundShapes]);
                break;
            }
            case EventTypes.ShapeUnselected: {
                this.selectedShapes = this.selectedShapes.filter(shape => shape.id !== eventShape.id);
                break;
            }
            case EventTypes.ShapeSelected: {
                this.selectedShapes.push(eventShape);
                break;
            }
        }
        this.drawBackground();
    }
}
//# sourceMappingURL=Canvas.js.map