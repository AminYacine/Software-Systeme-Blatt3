import { WebSocketService } from "./WebSocketService.js";
import { Overview } from "./overview.js";
import { CanvasView } from "./canvasView.js";
import { NotFoundView } from "./notFoundView.js";
//source: https://www.youtube.com/watch?v=6BozpmSjk-Y&ab_channel=dcode
export const router = async () => {
    //establish socket connection
    const wss = new WebSocketService();
    const routes = [
        { path: "/", view: Overview },
        { path: "/canvas", view: CanvasView },
        { path: "/404", view: NotFoundView },
    ];
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
    let match = potentialMatches.find((potentialMatch) => potentialMatch.isMatch);
    const view = new match.route.view();
    if (view instanceof CanvasView) {
        await wss.openConnection();
        const isPathOk = checkCanvasPath();
        console.log("isIdOk", isPathOk);
        if (isPathOk) {
            document.querySelector("#main-page").innerHTML = view.render();
        }
        else {
            document.querySelector("#main-page").innerHTML = new NotFoundView().render();
        }
    }
    else if (view instanceof Overview) {
        document.querySelector("#main-page").innerHTML = view.render();
        wss.initOverviewUI();
        await wss.openConnection();
    }
    //fill div with html by calling render method of view class
    // document.querySelector("#main-page").innerHTML = view.render();
    // if (view instanceof CanvasView) {
    //     init();
    // } else if (view instanceof Overview) {
    //     wss.initOverviewUI();
    // }
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