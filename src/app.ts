import { Renderer } from "./render/renderer.ts";
import { UniformSettings } from "./render/layouts/uniformBufferSettings.ts";

export class App 
{
    canvases: Map<string, HTMLCanvasElement>;
    renderer: Renderer;
    settings: UniformSettings = new UniformSettings();

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));

        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        this.renderer.Initialize().then(() => {
            this.run();
        });

        const frequencySlider = document.getElementById("frequency-slider") as HTMLInputElement;
        frequencySlider.addEventListener("input", () => {
            this.settings.frequency = parseFloat(frequencySlider.value);
        });
        const slitWidthSlider = document.getElementById("slit-width-slider") as HTMLInputElement;
        slitWidthSlider.addEventListener("input", () => {
            this.settings.slitWidth = parseFloat(slitWidthSlider.value);
        });
        const grateWidthSlider = document.getElementById("grate-width-slider") as HTMLInputElement;
        grateWidthSlider.addEventListener("input", () => {
            this.settings.grateWidth = parseFloat(grateWidthSlider.value);
        });
        const numberOfSlitsSlider = document.getElementById("number-of-slits-slider") as HTMLInputElement;
        numberOfSlitsSlider.addEventListener("input", () => {
            this.settings.numberOfSlits = parseFloat(numberOfSlitsSlider.value);
        });
    }

    run = () => {

        this.tickTimeForward();
        var running: boolean = true;

        // Render Settings
        const settingsContext = this.canvases.get("settingsMain")!.getContext('2d');
        if (settingsContext) {
            this.settings.renderSettingsUI(settingsContext);
        }

        // Render Viewport
        this.renderer.render(this.settings);

        // Request the next frame
        if (running) {
            requestAnimationFrame(this.run);
        }
    }

    tickTimeForward = () => {
        this.settings.deltaTime += 0.01; // Delta Time speed
    }
}