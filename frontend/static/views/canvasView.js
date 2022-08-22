export class CanvasView {
    render() {
        return `
        <body>

        <p>Wählen Sie auf der linken Seite Ihr Zeichenwerkzeug aus.
        Haben Sie eines ausgewählt, können Sie mit der Maus
        die entsprechenden Figuren zeichnen. Typischerweise, indem
        Sie die Maus drücken, dann mit gedrückter Maustaste die
        Form bestimmen, und dann anschließend die Maustaste loslassen.
        <div>
            <span class="block">Selektierte Form</span>
            <span id="selection-color">bb</span>
            <span class="block">Blockierte Form</span>
            <span id="blocked-color">bb</span>
        </div>
<!--        <div class="block">Blockierte Form<div id="blocked-color">bb</div></div>-->
        </p>

        <ul class="tools"></ul>

            <canvas id="backgroundArea" width="900" height="600"></canvas>
            <canvas id="creationArea" width="900" height="600"></canvas>

            </body>
            `;
    }
}
//# sourceMappingURL=canvasView.js.map