export class CanvasView {
    render() {
        return `
        <body>

        <p>Wählen Sie auf der linken Seite Ihr Zeichenwerkzeug aus.
        Haben Sie eines ausgewählt, können Sie mit der Maus
        die entsprechenden Figuren zeichnen. Typischerweise, indem
        Sie die Maus drücken, dann mit gedrückter Maustaste die
        Form bestimmen, und dann anschließend die Maustaste loslassen.
        </p>

        <ul class="tools"></ul>

            <canvas id="backgroundArea" width="900" height="600"></canvas>
            <canvas id="creationArea" width="900" height="600"></canvas>

            </body>
            `;
    }
}
//# sourceMappingURL=canvasView.js.map