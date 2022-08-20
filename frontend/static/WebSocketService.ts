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

let ws: WebSocket;
let openRooms: CanvasRoom [] = [];
let canvas: Canvas;

export async function openConnection() {
    ws = new WebSocket('ws://localhost:8080/web-socket');

    ws.onopen = (event) => {
        console.log("Open", event.type);
    }
    ws.onclose = (event) => {
        console.log("Close", event);
    }

    ws.onmessage = (message) => {
        let msg: AbstractEvent = JSON.parse(message.data)

        switch (msg.type) {
            case WebSocketEvents.CanvasCreated: {
                const createdEvent: CanvasCreatedEvent = msg.value;
                console.log("received canvas created", createdEvent);
                openRooms.push(new CanvasRoom(createdEvent.name, createdEvent.id));
                setCurrentCanvasRoom(createdEvent.id);
                if (createdEvent.clientId === getClientId()) {
                    window.history.pushState("", "", `/canvas/${createdEvent.id}`);
                    router();
                } else {
                    updateRoomListInHtml();
                }
                break;
            }
            case WebSocketEvents.RegisteredForCanvas: {
                console.log("registered For canvas");
                const registeredEvent: RegisteredForCanvasEvent = msg.value;
                console.log(registeredEvent.canvasId);
                setCurrentCanvasRoom(registeredEvent.canvasId);
                window.history.pushState("", "", `/canvas/${registeredEvent.canvasId}`);
                router();
                break;
            }
            case WebSocketEvents.CreatedClientId: {
                const connectedEvent: ConnectedEvent = msg.value;
                const currentClientID = getClientId();
                if (!currentClientID) {
                    console.log("noch keine id");
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
                    canvas.handleEvent(roomEvent.canvasEvent);
                } else {
                    console.log("canvas is null oder undefined", canvas)
                }
                break;
            }
            default : {
                console.log("message", message.data);
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
            console.log("input valid");
            sendCreateCanvasEvent(name.value);
        }
    });
}


export function containsRoom(roomId: string): boolean {
    console.log("in containsRoom")
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
            listElem.addEventListener("click", () => sendRegisterForCanvas(room.id));
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

function sendRegisterForCanvas(canvasId: string) {
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.RegisterForCanvas,
            new RegisterForCanvas(getClientId(), canvasId)
        )
    ));
}

function getClientId(): number {
    const clientId = sessionStorage.getItem("clientID");
    return Number(clientId);
}

function setClientId(clientId: number) {
    console.log("clientId set:", clientId);
    sessionStorage.setItem("clientID", clientId.toString());
}

function setCurrentCanvasRoom(canvasId: string) {
    sessionStorage.setItem("canvasID", canvasId);
}

export function removeCurrentCanvasRoom() {
    sessionStorage.removeItem("canvasID");
}

function getCurrentCanvasRoom(): string {
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
    console.log("sent Event to backend ", event);
    console.log("current room id", getCurrentCanvasRoom())
    ws.send(JSON.stringify(
        new AbstractEvent(
            WebSocketEvents.CanvasEvent,
            new RoomEvent(getClientId(), getCurrentCanvasRoom(), event)
        )
    ));
}
