export class Menu {
    items = [];
    menuDOM;
    helperDiv;
    innerDiv;

    constructor() {
        this.menuDOM = document.createElement("ul");
        this.helperDiv = document.createElement("div");
        this.innerDiv = document.createElement("div");

        this.helperDiv.setAttribute("class", "helperDiv");
        this.menuDOM.setAttribute("class", "ulMenu");
    }

    addItem(item) {
        this.items.push(item);
        this.menuDOM.appendChild(item.render());
    }

    addItems(items) {
        items.forEach(item => {
            this.items.push(item);
            this.menuDOM.appendChild(item.render());
        });
    }

    addItemAt(item, index) {
        this.items.splice(index, 0, item);
    }

    //filtert das übergebene item nach der id raus
    removeItem(item) {
        this.items = this.items.filter(value => {
            return value.id !== item.id;
        });
    }

    hide() {
        this.menuDOM.setAttribute("style", "display:none");
        while (this.menuDOM.firstChild) {
            this.menuDOM.removeChild(this.menuDOM.firstChild);
        }
        document.body.removeChild(this.helperDiv);
    }

    show(x, y) {

        //alle kinder werden entfernt, um das dynamische Item zu entfernen
        while (this.menuDOM.firstChild) {
            this.menuDOM.removeChild(this.menuDOM.firstChild);
        }
        //beim Anzeigen wird der array aller Elemente angezeigt, ohne dynamisches Item
        this.items.forEach((item) => {
            this.menuDOM.appendChild(item.render());
        });

        document.body.appendChild(this.helperDiv);
        this.helperDiv.appendChild(this.menuDOM);

        this.menuDOM.style.display = "block";
        this.helperDiv.style.display = "block";

        this.menuDOM.style.left = (x) + "px";
        this.menuDOM.style.top = (y) + "px";

        this.helperDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.helperDiv.addEventListener("click", () => {
                document.body.removeChild(this.helperDiv);
            }
        );
    }

}


export class MenuItem {
    id;
    domRepresentation;
    name;
    method;

    constructor(name, method) {
        this.id = Math.random();
        this.name = name;
        this.method = method;
        this.domRepresentation = document.createElement("li");
        this.domRepresentation.setAttribute("class", "menuItem");
        this.domRepresentation.textContent = name;
        this.domRepresentation.addEventListener("click", method);
    }

    render() {
        return this.domRepresentation;
    }
}

export class Separator extends MenuItem {
    constructor() {
        super();
        this.domRepresentation = document.createElement("hr");
    }
}

export class RadioOption {
    radioSelectionDiv;
    optionList;

    constructor(label, optionList, preSelection, canvas, fill) {
        this.optionList = optionList;

        this.radioSelectionDiv = document.createElement("div");
        this.radioSelectionDiv.setAttribute("class", "menuItem");
        let radioSelectionLabel = document.createElement("label");
        radioSelectionLabel.innerText = label;

        this.radioSelectionDiv.appendChild(radioSelectionLabel);

        for (let id in optionList) {

            let radioButton = document.createElement("input");
            radioButton.setAttribute("type", "radio");
            radioButton.setAttribute("name", label);
            radioButton.setAttribute("id", optionList[id]);

            if (preSelection === id) {
                radioButton.setAttribute("checked", "checked");
            }

            let radioButtonLabel = document.createElement("label");
            radioButtonLabel.innerText = optionList[id];

            let divRadioButton = document.createElement("div");

            divRadioButton.addEventListener("click", () => {
                let selectedShapes = canvas.selectedShapes;
                for (const shapesId in selectedShapes) {
                    const shape = selectedShapes[shapesId];
                    if (fill) {
                        shape.setFillColor(id);
                    } else {
                        shape.setOutlineColor(id);
                    }
                    // canvas.sendEvent(new CanvasEvent(EventTypes.ShapeAdded, Canvas.getShapeType(shape), shape));
                    canvas.addShape(shape, true, false);
                }
            });
            divRadioButton.appendChild(radioButton);
            divRadioButton.appendChild(radioButtonLabel);

            this.radioSelectionDiv.appendChild(divRadioButton);
        }
    }

    render() {
        return this.radioSelectionDiv;
    }
}