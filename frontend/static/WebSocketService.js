import { WebSocketEvents } from "./WebSocketEvents.js";
import { AbstractEvent } from "./AbstractEvent.js";
import { router } from "./index.js";
import { CanvasRoom } from "./CanvasRoom.js";
import { RegisterForCanvas } from "./RegisterForCanvas.js";
import { CreateCanvasEvent } from "./CreateCanvasEvent.js";
import { DeregisterFromCanvasEvent } from "./DeregisterFromCanvasEvent.js";
export class WebSocketService {
    constructor() {
        this.openRooms = [];
    }
    async openConnection() {
        this.ws = new WebSocket('ws://localhost:8080/web-socket');
        this.ws.onopen = (event) => {
            console.log("Open", event.type);
        };
        this.ws.onclose = (event) => {
            console.log("Close", event);
        };
        this.ws.onmessage = (message) => {
            let msg = JSON.parse(message.data);
            switch (msg.type) {
                case WebSocketEvents.CanvasCreated: {
                    const createdEvent = msg.value;
                    console.log("received canvas created", createdEvent);
                    this.openRooms.push(new CanvasRoom(createdEvent.name, createdEvent.id));
                    window.history.pushState("", "", `/canvas/${createdEvent.id}`);
                    router();
                    break;
                }
                case WebSocketEvents.RegisteredForCanvas: {
                    console.log("registered For canvas");
                    const registeredEvent = msg.value;
                    this.setCurrentCanvasRoom(registeredEvent.canvasId);
                    window.history.pushState("", "", `/canvas/${registeredEvent.canvasId}`);
                    router();
                    break;
                }
                case WebSocketEvents.CreatedClientId: {
                    const connectedEvent = msg.value;
                    const currentClientID = this.getClientId();
                    if (!currentClientID) {
                        console.log("noch keine id");
                        this.setClientId(connectedEvent.clientId);
                    }
                    this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.SessionID, this.getClientId())));
                    this.openRooms = connectedEvent.openRooms;
                    this.updateRoomListInHtml();
                    break;
                }
                default: {
                    console.log("message", message.data);
                }
            }
        };
        await this.waitForSocketConnection();
    }
    initOverviewUI() {
        const name = document.getElementById("roomName");
        const button = document.getElementById("newRoomButton");
        button.addEventListener("click", (ev) => {
            if (name.value) {
                console.log("input valid");
                this.sendCreateCanvasEvent(name.value);
            }
        });
    }
    containsRoom(roomId) {
        console.log("in containsRoom");
        const foundRoom = this.openRooms.find(room => roomId === room.id);
        return foundRoom !== undefined;
    }
    waitForSocketConnection() {
        return new Promise(((resolve, reject) => {
            const maxNumberOfAttempts = 10;
            const intervalTimeInMs = 400;
            let currentAttempt = 0;
            const interval = setInterval(() => {
                if (currentAttempt > maxNumberOfAttempts - 1) {
                    clearInterval(interval);
                    reject("Maximum number of attempts exceeded");
                }
                else if (this.ws.readyState === WebSocket.OPEN) {
                    clearInterval(interval);
                    resolve("");
                }
                currentAttempt++;
            }, intervalTimeInMs);
        }));
    }
    updateRoomListInHtml() {
        //only needs to be rendered if current page is overview
        if (window.location.pathname === '/') {
            const list = document.getElementById("rooms");
            //remove every list item to fill with current ones
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
            this.openRooms.forEach(room => {
                const listElem = document.createElement("li");
                listElem.innerHTML = `${room.name} (${room.id})`;
                listElem.setAttribute("class", "clickable");
                listElem.addEventListener("click", () => this.sendRegisterForCanvas(room.id));
                list.appendChild(listElem);
            });
        }
    }
    sendCreateCanvasEvent(canvasName) {
        this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CreateCanvas, new CreateCanvasEvent(canvasName, this.getClientId()))));
    }
    sendRegisterForCanvas(canvasId) {
        this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.RegisterForCanvas, new RegisterForCanvas(this.getClientId(), canvasId))));
    }
    getClientId() {
        const clientId = sessionStorage.getItem("clientID");
        return Number(clientId);
    }
    setClientId(clientId) {
        console.log("clientId set:", clientId);
        sessionStorage.setItem("clientID", clientId.toString());
    }
    setCurrentCanvasRoom(canvasId) {
        sessionStorage.setItem("canvasID", canvasId);
    }
    removeCurrentCanvasRoom() {
        sessionStorage.removeItem("canvasID");
    }
    getCurrentCanvasRoom() {
        return sessionStorage.getItem("canvasID");
    }
    deregisterFromCanvas() {
        this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.DeregisterForCanvas, new DeregisterFromCanvasEvent(this.getClientId(), this.getCurrentCanvasRoom()))));
    }
}
//# sourceMappingURL=WebSocketService.js.map