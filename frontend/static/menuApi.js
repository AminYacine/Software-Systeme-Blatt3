import {Menu, MenuItem, RadioOption, Separator} from "./menu.js";

//Methoden zum Erstellen von Menü und Items
export class MenuApi {
    static createMenu() {
        return new Menu();
    }

    static createItem(name, method) {
        return new MenuItem(name, method);
    }

    static createSeparator() {
        return new Separator();
    }

    static createRadioOption(label, optionList, preSelection, canvas , fill) {
        return new RadioOption(label, optionList, preSelection, canvas, fill);
    }
}