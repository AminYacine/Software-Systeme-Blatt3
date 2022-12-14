import {WebSocketEvents} from "./WebSocketEvents.js";
import {AbstractEvent} from "./AbstractEvent.js";
import {RegisteredForCanvasEvent} from "./RegisteredForCanvasEvent.js";
import {router} from "./index.js";
import {CanvasRoom} from "./CanvasRoom.js";
import {ConnectedEvent} from "./ConnectedEvent.js";
import {CanvasCreatedEvent} from "../../ws-events/CanvasCreatedEvent.js";
import {RegisterForCanvas} from "./RegisterForCanvas.js";
import {CreateCanvasEvent} from "./CreateCanvasEvent.js";
import {DeregisterFromCanvasEvent} from "./DeregisterFromCanvasEvent.js";
import {CanvasEvent} from "./Event.js";
import {RoomEvent} from "./RoomEvent.js";
import {Canvas} from "./Canvas.js";
import {init} from "./init.js";
import {GetCanvasEventsResponse} from "./GetCanvasEventsResponse.js";
import {GetCanvasEvents} from "./GetCanvasEvents.js";

let ws: WebSocket;
let openRooms: CanvasRoom [] = [];
let canvas: Canvas;

export async function openConnection() {
    ws = new WebSocket('ws://localhost:8080/web-socket');

    ws.onopen = (event) => {}
    ws.onclose = (event) => {}

    ws.onmessage = (message) => {
        let msg: AbstractEvent = JSON.parse(message.data)
        switch (msg.type) {
            case WebSocketEvents.CanvasCreated: {
                const createdEvent: CanvasCreatedEvent = msg.value;
                openRooms.push(new CanvasRoom(createdEvent.name, createdEvent.id));
                if (createdEvent.clientId === getClientId()) {
                    setCurrentCanvasRoom(createdEvent.id);
                    window.history.pushState("", "", `/canvas/${createdEvent.id}`);
                    router();
                } else {
                    updateRoomListInHtml();
                }
                break;
            }
            case WebSocketEvents.RegisteredForCanvas: {
                const registeredEvent: RegisteredForCanvasEvent = msg.value;
                const canvasId = registeredEvent.canvasId;
                setCurrentCanvasRoom(canvasId);
                window.history.pushState("", "", `/canvas/${canvasId}`);
                router();
                break;
            }
            case WebSocketEvents.CreatedClientId: {
                const connectedEvent: ConnectedEvent = msg.value;
                const currentClientID = getClientId();
                if (!currentClientID) {
                    setClientId(connectedEvent.clientId);
                }
                ws.send(JSON.stringify(
                    new AbstractEvent(
                        WebSocketEvents.SessionID,
                        getClientId()
                    )
                ));
                openRooms = connectedEvent.openRooms;
                updateRoomListInHtml();
                break;
            }
            case WebSocketEvents.CanvasChangedEvent: {
                const roomEvent: RoomEvent = msg.value;
                if (canvas) {
                    canvas.handleEvent(roomEvent.canvasEvent, roomEvent.clientId);
                }
                break;
            }
            case WebSocketEvents.GetCanvasEventsResponse: {
                const roomEvents: GetCanvasEventsResponse = msg.value;
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
                    }
                }
                break;
            }
        }
    }
    await waitForSocketConnection();
}

export function initCanvasView() {
    canvas = init();
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


export function containsRoom(roomId: string): boolean {
    const foundRoom = openRooms.find(room => roomId === room.id);
    return foundRoom !== undefined;
}

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

function updateRoomListInHtml() {
    //only needs to be rendered if current page is overview
    if (window.location.pathname === '/') {
        const list: HTMLUListElement = document.getElementById("rooms") as HTMLUListElement;
        //remove every list item to fill with current ones
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        openRooms.forEach(room => {
            const listElem = document.createElement("li");
            listElem.innerHTML = `${room.name} (${room.id})`;
            listElem.setAttribute("class", "clickable");
            listElem.addEventListener("click", () => sendRegisterForCanvasEvent(room.id));
            list.appendChild(listElem);
        });
    }
}

function sendCreateCanvasEvent(canvasName: string) {
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.CreateCanvas,
            new CreateCanvasEvent(canvasName, getClientId())
        )
    ));
}

function sendRegisterForCanvasEvent(canvasId: string) {
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.RegisterForCanvas,
            new RegisterForCanvas(getClientId(), canvasId)
        )
    ));
}

export function sendGetCanvasEvents() {

    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.GetCanvasEvents,
            new GetCanvasEvents(
                getCurrentCanvasRoom(),
                getClientId()
            )
        )
    ))
}

export function getClientId(): number {
    const clientId = sessionStorage.getItem("clientID");
    return Number(clientId);
}

function setClientId(clientId: number) {
    sessionStorage.setItem("clientID", clientId.toString());
}

function setCurrentCanvasRoom(canvasId: string) {
    sessionStorage.setItem("canvasID", canvasId);
}

export function removeCurrentCanvasRoom() {
    sessionStorage.removeItem("canvasID");
}

export function getCurrentCanvasRoom(): string {
    return sessionStorage.getItem("canvasID");
}

export function deregisterFromCanvas() {
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.DeregisterForCanvas,
            new DeregisterFromCanvasEvent(getClientId(), getCurrentCanvasRoom())
        )
    ));
}

export function sendCanvasEvent(event: CanvasEvent) {
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.CanvasEvent,
            new RoomEvent(getClientId(), getCurrentCanvasRoom(), event)
        )
    ));
}
