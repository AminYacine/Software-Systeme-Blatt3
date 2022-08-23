import {WebSocketEvents} from "../enums/WebSocketEvents.js";
import {AbstractEventDTO} from "../dtos/AbstractEventDTO.js";
import {RegisteredForCanvasEventDTO} from "../dtos/RegisteredForCanvasEventDTO.js";
import {router} from "../index.js";
import {CanvasRoom} from "../models/CanvasRoom.js";
import {ConnectedEventDTO} from "../dtos/ConnectedEventDTO.js";
import {CanvasCreatedEventDTO} from "../dtos/CanvasCreatedEventDTO.js";
import {RoomEvent} from "../models/RoomEvent.js";
import {Canvas} from "../canvas/Canvas.js";
import {initCanvas} from "../canvas/initCanvas.js";
import {GetCanvasEventsResponseDTO} from "../dtos/GetCanvasEventsResponseDTO.js";
import {sendCreateCanvasEvent, sendEvent, sendRegisterForCanvasEvent} from "./WebSocketHelper.js";


export let ws: WebSocket;
let openRooms: CanvasRoom [] = [];
let canvas: Canvas;

/**
 * connects to the backend and waits a few seconds for an open connection.
 */
export async function openConnection() {
    ws = new WebSocket('ws://localhost:8080/web-socket');

    ws.onopen = (event) => {
        console.log("Open", event.type);
    }
    ws.onclose = (event) => {
        console.log("Close", event);
    }

    //when the backend sends a message it will be handled here depending on the type
    ws.onmessage = (message) => {
        let msg: AbstractEventDTO = JSON.parse(message.data)
        console.log("event:", msg)

        switch (msg.type) {
            case WebSocketEvents.CanvasCreated: {
                handleCanvasCreated(msg.value);
                break;
            }
            case WebSocketEvents.RegisteredForCanvas: {
                handleRegisteredForCanvas(msg.value);
                break;
            }
            case WebSocketEvents.CreatedClientId: {
                handleCreatedClient(msg.value);
                break;
            }
            case WebSocketEvents.CanvasChangedEvent: {
                handleCanvasChangedEvent(msg.value);
                break;
            }
            case WebSocketEvents.GetCanvasEventsResponse: {
                handleGetCanvasEventsResponse(msg.value);
                break;
            }
        }
    }
    await waitForSocketConnection();
}

/**
 * Adds a new CanvasRoom to the list and switches to the canvas view.
 * @param createdEvent
 */
function handleCanvasCreated(createdEvent: CanvasCreatedEventDTO) {
    console.log("received canvas created", createdEvent);
    openRooms.push(new CanvasRoom(createdEvent.name, createdEvent.id));
    // if the current user created the event, the view is changed to canvas view
    // else the open room list in the overview is updated so the user can see the new room
    if (createdEvent.clientId === getClientId()) {
        setCurrentCanvasRoom(createdEvent.id);
        window.history.pushState("", "", `/canvas/${createdEvent.id}`);
        router();
    } else {
        updateRoomListInHtml();
    }
}

/**
 * Adds the received canvasId to the session storage and changes to the canvas view.
 * @param registeredEvent
 */
function handleRegisteredForCanvas(registeredEvent: RegisteredForCanvasEventDTO) {
    const canvasId = registeredEvent.canvasId;
    setCurrentCanvasRoom(canvasId);
    window.history.pushState("", "", `/canvas/${canvasId}`);
    router();
}

/**
 * Sets the clientId to the session storage if not already defined.
 * Otherwise, sends an event with the current clientId to the backend.
 * @param connectedEvent
 */
function handleCreatedClient(connectedEvent: ConnectedEventDTO) {
    const currentClientID = getClientId();
    if (!currentClientID) {
        console.log("noch keine id");
        setClientId(connectedEvent.clientId);
    }
    sendEvent(WebSocketEvents.SessionID, getClientId());
    openRooms = connectedEvent.openRooms;
    updateRoomListInHtml();
}

/**
 * Handles the event by calling the handleEvent from the canvas instance.
 * @param roomEvent
 */
function handleCanvasChangedEvent(roomEvent: RoomEvent) {
    if (canvas) {
        canvas.handleEvent(roomEvent.canvasEvent, roomEvent.clientId);
    }
}

/**
 * For every event, calls the handleEvent function from the canvas instance.
 * Updates the blockedShapes array in the canvas instance.
 * @param roomEvents
 */
function handleGetCanvasEventsResponse(roomEvents: GetCanvasEventsResponseDTO) {
    // retrieves the blocked shapes
    const blockedShapesObject = roomEvents.blockedShapes;
    let  blockedShapes = new Map<string,number>();
    for (var shapeId in blockedShapesObject) {
        blockedShapes.set(shapeId, blockedShapesObject[shapeId])
    }

    if (roomEvents.canvasId === getCurrentCanvasRoom()) {
        for (let event of roomEvents.events) {
            canvas.handleEvent(event.canvasEvent, event.clientId);
        }
        if (blockedShapes.size > 0) {
            for (let shapeId of blockedShapes.keys()) {
                const foundShape = canvas.backGroundShapes.get(shapeId);
                if (foundShape) {
                    canvas.blockedShapes.push(foundShape);
                }
            }
            //Draw shapes to update all blocked shapes in ui
            canvas.drawBackground();
            console.log("set blocked shapes", canvas.blockedShapes)
        }
    }
}

/**
 * Initiates canvas html view and sets the canvas instance.
 */
export function initCanvasView() {
    canvas = initCanvas();
}

export function initOverviewUI() {
    const name = document.getElementById("roomName") as HTMLInputElement;
    const button = document.getElementById("newRoomButton");

    button.addEventListener("click", (ev) => {
        if (name.value) {
            sendCreateCanvasEvent(name.value);
        }
    });
}

/**
 * Checks if the passed roomId is the openRooms list.
 * If so returns true, else false.
 * @param roomId
 */
export function containsRoom(roomId: string): boolean {
    console.log("in containsRoom")
    const foundRoom = openRooms.find(room => roomId === room.id);
    return foundRoom !== undefined;
}

/**
 * Removes the current canvas room from the session storage.
 */
export function removeCurrentCanvasRoom() {
    sessionStorage.removeItem("canvasID");
}

/**
 * Retrieves the canvas room from the session storage.
 */
export function getCurrentCanvasRoom(): string {
    return sessionStorage.getItem("canvasID");
}

/**
 * Sets the canvas room to the session storage.
 */
function setCurrentCanvasRoom(canvasId: string) {
    sessionStorage.setItem("canvasID", canvasId);
}

/**
 * Retrieves the clientId from the session storage.
 */
export function getClientId(): number {
    const clientId = sessionStorage.getItem("clientID");
    return Number(clientId);
}

/**
 * Sets the clientId to the session storage.
 */
function setClientId(clientId: number) {
    console.log("clientId set:", clientId);
    sessionStorage.setItem("clientID", clientId.toString());
}

/**
 * Updates the overview page by adding new rooms to the list.
 */
function updateRoomListInHtml() {
    //only needs to be rendered if current page is overview
    if (window.location.pathname === '/') {
        const list: HTMLUListElement = document.getElementById("rooms") as HTMLUListElement;
        //remove every list item to fill with current ones
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        // adds list elements to the list
        openRooms.forEach(room => {
            const listElem = document.createElement("li");
            listElem.innerHTML = `${room.name} (${room.id})`;
            listElem.setAttribute("class", "clickable");
            listElem.addEventListener("click", () => sendRegisterForCanvasEvent(room.id));
            list.appendChild(listElem);
        });
    }
}

/**
 * Wait 10 times for 0.4 seconds for the connection to open.
 */
function waitForSocketConnection(): Promise<any> {
    return new Promise(((resolve, reject) => {
        const maxNumberOfAttempts = 10;
        const intervalTimeInMs = 400;

        let currentAttempt = 0;
        const interval = setInterval(() => {
            if (currentAttempt > maxNumberOfAttempts - 1) {
                clearInterval(interval);
                reject("Maximum number of attempts exceeded");
            } else if (ws.readyState === WebSocket.OPEN) {
                clearInterval(interval);
                resolve("");
            }
            currentAttempt++;
        }, intervalTimeInMs);
    }));
}