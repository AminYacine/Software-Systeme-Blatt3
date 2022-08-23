import * as wss from "./websocket/WebSocketService.js";
import { Overview } from "./views/overview.js";
import { CanvasView } from "./views/canvasView.js";
import { NotFoundView } from "./views/notFoundView.js";
import { sendDeregisterFromCanvasEvent, sendGetCanvasEvents, } from "./websocket/WebSocketHelper.js";
import { getCurrentCanvasRoom } from "./websocket/WebSocketService.js";
/**
 * Checks the pathname and initiates the appropriate view.
 */
//source: https://www.youtube.com/watch?v=6BozpmSjk-Y&ab_channel=dcode
export const router = async () => {
    const routes = [
        { path: "/", view: Overview },
        { path: "/canvas", view: CanvasView },
        { path: "/404", view: NotFoundView },
    ];
    // checks wich route matches the current path
    const potentialMatches = routes.map((route) => {
        if (route.path === "/canvas") {
            return {
                route: route,
                isMatch: /^\/canvas\//.test(location.pathname),
                ///^\/canvas\/[0-9]{0,9}$/
            };
        }
        else if (route.path === "/") {
            return {
                route: route,
                isMatch: location.pathname === route.path,
            };
        }
        else {
            return {
                route: route,
                isMatch: true
            };
        }
    });
    // route that matches path is set
    let match = potentialMatches.find((potentialMatch) => potentialMatch.isMatch);
    const view = new match.route.view();
    if (view instanceof CanvasView) {
        // If the canvas id in the path matches any of the list the canvas view is rendered.
        // Else the not found view is displayed
        await wss.openConnection();
        const isPathOk = checkCanvasPath();
        console.log("isIdOk", isPathOk);
        if (isPathOk) {
            document.querySelector("#main-page").innerHTML = view.render();
            sendGetCanvasEvents();
            wss.initCanvasView();
        }
        else {
            wss.removeCurrentCanvasRoom();
            document.querySelector("#main-page").innerHTML = new NotFoundView().render();
        }
    }
    else if (view instanceof Overview) {
        //overview is rendered
        document.querySelector("#main-page").innerHTML = view.render();
        wss.initOverviewUI();
        await wss.openConnection();
        if (getCurrentCanvasRoom()) {
            console.log("sent deregister");
            sendDeregisterFromCanvasEvent();
            wss.removeCurrentCanvasRoom();
        }
    }
    /**
     * checks if the id in the path matches any of the canvas list ids
     */
    function checkCanvasPath() {
        const path = location.pathname;
        const id = path.substring(path.lastIndexOf('/') + 1);
        return wss.containsRoom(id);
    }
};
window.onpopstate = router;
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
        const target = e.target;
        if (target.matches("[data-link]")) {
            e.preventDefault();
            history.pushState(null, null, target.href);
            router();
        }
    });
    router();
});
//# sourceMappingURL=index.js.map