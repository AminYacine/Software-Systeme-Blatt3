import { WebSocketEvents } from "./WebSocketEvents.js";
import { AbstractEvent } from "./AbstractEvent.js";
import { router } from "./index.js";
import { RegisterForCanvas } from "./RegisterForCanvas.js";
export class WebSocketService {
    constructor() {
        this.openRooms = [];
    }
    openConnection() {
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
                    window.history.pushState("", "", `/canvas/${createdEvent.id}`);
                    router();
                    break;
                }
                case WebSocketEvents.RegisteredForCanvas: {
                    console.log("registered For canvas");
                    const registeredEvent = msg.value;
                    window.history.pushState("", "", `/canvas/${registeredEvent.canvasId}`);
                    router();
                    break;
                }
                case WebSocketEvents.ClientId: {
                    const connectedEvent = msg.value;
                    this.openRooms = connectedEvent.openRooms;
                    this.updateRoomListInHtml();
                    break;
                }
                default: {
                    console.log("message", message.data);
                }
            }
        };
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
        this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.CreateCanvas, canvasName)));
    }
    sendRegisterForCanvas(canvasId) {
        this.ws.send(JSON.stringify(new AbstractEvent(WebSocketEvents.RegisterForCanvas, new RegisterForCanvas(canvasId))));
    }
}
//# sourceMappingURL=WebSocketService.js.map