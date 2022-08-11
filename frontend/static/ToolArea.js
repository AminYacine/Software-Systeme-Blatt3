export class ToolArea {
    constructor(shapesSelector, menu) {
        this.selectedShape = undefined;
        const domElms = [];
        shapesSelector.forEach(sl => {
            const domSelElement = document.createElement("li");
            domSelElement.innerText = sl.label;
            menu.appendChild(domSelElement);
            domElms.push(domSelElement);
            domSelElement.addEventListener("click", () => {
                selectFactory.call(this, sl, domSelElement);
            });
        });
        function selectFactory(sl, domElm) {
            // remove class from all elements
            for (let j = 0; j < domElms.length; j++) {
                domElms[j].classList.remove("marked");
            }
            this.selectedShape = sl;
            // add class to the one that is selected currently
            domElm.classList.add("marked");
        }
    }
    getSelectedShape() {
        return this.selectedShape;
    }
}
//# sourceMappingURL=ToolArea.js.map