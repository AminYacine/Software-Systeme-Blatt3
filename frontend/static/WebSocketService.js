import { WebSocketEvents } from "./WebSocketEvents.js";
import { AbstractEvent } from "./AbstractEvent.js";
import { router } from "./index.js";
import { CanvasRoom } from "./CanvasRoom.js";
import { RegisterForCanvas } from "./RegisterForCanvas.js";
import { CreateCanvasEvent } from "./CreateCanvasEvent.js";
import { DeregisterFromCanvasEvent } from "./DeregisterFromCanvasEvent.js";
import { RoomEvent } from "./RoomEvent.js";
import { init } from "./init.js";
import { GetCanvasEvents } from "./GetCanvasEvents.js";
let ws;
let openRooms = [];
let canvas;
export async function openConnection() {
    ws = new WebSocket('ws://localhost:8080/web-socket');
    ws.onopen = (event) => {
        console.log("Open", event.type);
    };
    ws.onclose = (event) => {
        console.log("Close", event);
    };
    ws.onmessage = (message) => {
        let msg = JSON.parse(message.data);
        switch (msg.type) {
            case WebSocketEvents.CanvasCreated: {
                const createdEvent = msg.value;
                console.log("received canvas created", createdEvent);
                openRooms.push(new CanvasRoom(createdEvent.name, createdEvent.id));
                setCurrentCanvasRoom(createdEvent.id);
                if (createdEvent.clientId === getClientId()) {
                    window.history.pushState("", "", `/canvas/${createdEvent.id}`);
                    router();
                }
                else {
                    updateRoomListInHtml();
                }
                break;
            }
            case WebSocketEvents.RegisteredForCanvas: {
                const registeredEvent = msg.value;
                const canvasId = registeredEvent.canvasId;
                setCurrentCanvasRoom(canvasId);
                window.history.pushState("", "", `/canvas/${canvasId}`);
                router();
                break;
            }
            case WebSocketEvents.CreatedClientId: {
                const connectedEvent = msg.value;
                const currentClientID = getClientId();
                if (!currentClientID) {
                    console.log("noch keine id");
                    setClientId(connectedEvent.clientId);
                }
                ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.SessionID, getClientId())));
                openRooms = connectedEvent.openRooms;
                updateRoomListInHtml();
                break;
            }
            case WebSocketEvents.CanvasChangedEvent: {
                const roomEvent = msg.value;
                if (canvas) {
                    canvas.handleEvent(roomEvent.canvasEvent, roomEvent.clientId);
                }
                else {
                    console.log("canvas is null oder undefined", canvas);
                }
                break;
            }
            case WebSocketEvents.GetCanvasEventsResponse: {
                const roomEvents = msg.value;
                console.log("received events", roomEvents);
                if (roomEvents.canvasId === getCurrentCanvasRoom()) {
                    for (let event of roomEvents.events) {
                        canvas.handleEvent(event.canvasEvent, event.clientId);
                    }
                }
                break;
            }
        }
    };
    await waitForSocketConnection();
}
export function initCanvasView() {
    canvas = init();
}
export function initOverviewUI() {
    const name = document.getElementById("roomName");
    const button = document.getElementById("newRoomButton");
    button.addEventListener("click", (ev) => {
        if (name.value) {
            console.log("input valid");
            sendCreateCanvasEvent(name.value);
        }
    });
}
export function containsRoom(roomId) {
    console.log("in containsRoom");
    const foundRoom = openRooms.find(room => roomId === room.id);
    return foundRoom !== undefined;
}
function waitForSocketConnection() {
    return new Promise(((resolve, reject) => {
        const maxNumberOfAttempts = 10;
        const intervalTimeInMs = 400;
        let currentAttempt = 0;
        const interval = setInterval(() => {
            if (currentAttempt > maxNumberOfAttempts - 1) {
                clearInterval(interval);
                reject("Maximum number of attempts exceeded");
            }
            else if (ws.readyState === WebSocket.OPEN) {
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
        const list = document.getElementById("rooms");
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
function sendCreateCanvasEvent(canvasName) {
    ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CreateCanvas, new CreateCanvasEvent(canvasName, getClientId()))));
}
function sendRegisterForCanvasEvent(canvasId) {
    ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.RegisterForCanvas, new RegisterForCanvas(getClientId(), canvasId))));
}
export function sendGetCanvasEvents() {
    ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.GetCanvasEvents, new GetCanvasEvents(getCurrentCanvasRoom(), getClientId()))));
}
export function getClientId() {
    const clientId = sessionStorage.getItem("clientID");
    return Number(clientId);
}
function setClientId(clientId) {
    console.log("clientId set:", clientId);
    sessionStorage.setItem("clientID", clientId.toString());
}
function setCurrentCanvasRoom(canvasId) {
    sessionStorage.setItem("canvasID", canvasId);
}
export function removeCurrentCanvasRoom() {
    sessionStorage.removeItem("canvasID");
}
export function getCurrentCanvasRoom() {
    return sessionStorage.getItem("canvasID");
}
export function deregisterFromCanvas() {
    ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.DeregisterForCanvas, new DeregisterFromCanvasEvent(getClientId(), getCurrentCanvasRoom()))));
}
export function sendCanvasEvent(event) {
    ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CanvasEvent, new RoomEvent(getClientId(), getCurrentCanvasRoom(), event))));
}
//# sourceMappingURL=WebSocketService.js.map