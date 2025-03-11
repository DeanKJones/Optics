import { App } from "./app"

const canvases = {
    viewportMain: <HTMLCanvasElement>document.getElementById("gfx-main")
};

const app = new App(canvases);
app.run();
