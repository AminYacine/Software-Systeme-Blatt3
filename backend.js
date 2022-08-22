import { WsService } from "./WsService.js";
import { createRequire } from "module";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const path = require("path");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const http = require("http");
const express = require("express");
const webSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wsService = new WsService();
const appDir = path.resolve(__dirname, "frontend/");
function run() {
    app.use('/canvas', express.static(appDir));
    app.use('/', express.static(appDir));
    app.get('*', function (req, res) {
        res.sendFile(path.resolve(appDir, "index.html"));
    });
    const wss = new webSocket.Server({ server: server });
    wss.on("connection", function (client) {
        wsService.handleConnection(client);
        client.on("message", (message) => {
            wsService.handleMessage(message.toString(), client);
        });
    });
    server.listen(8080, () => console.log("Server running"));
}
run();
//# sourceMappingURL=backend.js.map