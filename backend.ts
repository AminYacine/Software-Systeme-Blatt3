import {WsService} from "./services/WsService.js";

import {createRequire} from "module";
import { RawData } from "ws";
import {AbstractEvent} from "./ws-events/AbstractEvent";

const require = createRequire(import.meta.url);

const http = require("http");
const path = require("path");
const express = require("express");
const webSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wsService = new WsService();

function run() {
    app.use("/static", express.static(path.resolve("frontend", "static")));

    app.get("/*", ((req, res) => {
        res.sendFile(path.resolve("frontend", "index.html"))
    }));


    const wss = new webSocket.Server({server: server});

    wss.on("connection", function (client) {
        const id = wsService.addClient(client);
        client.send(JSON.stringify({
            "type": "ClientId",
            "data": {"clientId": id},
        }));

        client.on("message", (message: Buffer) => {
            wsService.handleMessage(message.toString(), client);
        });

    });

    server.listen(8080, () => console.log("Server running"));
}

run();