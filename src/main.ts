import { App } from "./app"

const canvases = {
    viewportMain: <HTMLCanvasElement>document.getElementById("gfx-main"),
    settingsMain: <HTMLCanvasElement>document.getElementById("settings")
};

const app = new App(canvases);
app.run();
