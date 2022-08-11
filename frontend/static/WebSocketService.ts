import {WebSocketEvents} from "./WebSocketEvents.js";
import {AbstractEvent} from "./AbstractEvent.js";
import {RegisteredForCanvas} from "./RegisteredForCanvas.js";

export class WebSocketService {
     ws: WebSocket;

    constructor() {
    }

    openConnection() {
        this.ws = new WebSocket('ws://localhost:8080/web-socket');
        console.log("ready state: ", this.ws.readyState);

        this.ws.onopen = (event) => {
            console.log("Open", event.type);
        }
        this.ws.onclose = (event) => {
            console.log("Close", event);
        }

        this.ws.onmessage = (event) => {
           let msg: AbstractEvent = JSON.parse(event.data)

            switch (msg.type) {
                case WebSocketEvents.CanvasCreated: {
                    console.log("CLIENT: received canvas created");
                    location.replace("/canvas");

                    break;
                }
                case WebSocketEvents.RegisteredForCanvas: {
                    const registerEvent: RegisteredForCanvas = msg.value;
                    break;
                }
                case WebSocketEvents.ClientId: {
                    console.log("received id", event.data);
                    break;
                }
                default : {
                    console.log("message", event.data);
                }
            }

        }
    }

    initCreateCanvas() {
        const name = document.getElementById("roomName") as HTMLInputElement;
        const button = document.getElementById("newRoomButton");

        button.addEventListener("click",(ev) => {
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
