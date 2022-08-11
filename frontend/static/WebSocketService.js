import { WebSocketEvents } from "./WebSocketEvents.js";
export class WebSocketService {
    constructor() {
    }
    openConnection() {
        this.ws = new WebSocket('ws://localhost:8080/web-socket');
        console.log("ready state: ", this.ws.readyState);
        this.ws.onopen = (event) => {
            console.log("Open", event.type);
        };
        this.ws.onclose = (event) => {
            console.log("Close", event);
        };
        this.ws.onmessage = (event) => {
            let msg = JSON.parse(event.data);
            switch (msg.type) {
                case WebSocketEvents.CanvasCreated: {
                    console.log("CLIENT: received canvas created");
                    location.replace("/canvas");
                    break;
                }
                case WebSocketEvents.RegisteredForCanvas: {
                    const registerEvent = msg.value;
                    break;
                }
                case WebSocketEvents.ClientId: {
                    console.log("received id", event.data);
                    break;
                }
                default: {
                    console.log("message", event.data);
                }
            }
        };
    }
    initCreateCanvas() {
        const name = document.getElementById("roomName");
        const button = document.getElementById("newRoomButton");
        button.addEventListener("click", (ev) => {
            console.log("click");
            if (name.value) {
                console.log("input valid");
                this.ws.send(JSON.stringify({
                    "type": WebSocketEvents.CreateCanvas,
                    "value": name.value,
                }));
            }
        });
    }
}
//# sourceMappingURL=WebSocketService.js.map