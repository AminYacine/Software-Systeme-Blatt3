import { init } from "./init.js";
import { WebSocketService } from "./WebSocketService.js";
import { Overview } from "./overview.js";
import { CanvasView } from "./canvasView.js";
import { NotFoundView } from "./notFoundView.js";
//source: https://www.youtube.com/watch?v=6BozpmSjk-Y&ab_channel=dcode
const router = async () => {
    const routes = [
        { path: "/", view: Overview },
        { path: "/canvas", view: CanvasView },
        { path: "/404", view: NotFoundView },
    ];
    const potentialMatches = routes.map((route) => {
        if (route.path === "/canvas") {
            console.log("pathname:", location.pathname);
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
    //establish socket connection
    const wss = new WebSocketService();
    wss.openConnection();
    let match = potentialMatches.find((potentialMatch) => potentialMatch.isMatch);
    const view = new match.route.view();
    //fill div with html by calling render method of view class
    document.querySelector("#main-page").innerHTML = view.render();
    if (view instanceof CanvasView) {
        init();
    }
    else if (view instanceof Overview) {
        console.log("in overview");
        wss.initCreateCanvas();
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