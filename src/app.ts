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

        const sliderConfigs = [
            { elementId: "frequency-slider", settingKey: "frequency" },
            { elementId: "slit-width-slider", settingKey: "slitWidth" },
            { elementId: "grate-width-slider", settingKey: "grateWidth" },
            { elementId: "number-of-slits-slider", settingKey: "numberOfSlits" },
            { elementId: "screen-size-mult-slider", settingKey: "screenSize" },
        ];
        
        // Add event listeners for each slider
        sliderConfigs.forEach(({ elementId, settingKey }) => {
            const slider = document.getElementById(elementId) as HTMLInputElement;
            if (slider) {
                slider.addEventListener("input", () => {
                    const value = parseFloat(slider.value);
                    this.settings.setProperty(settingKey as any, value);
                });
            }
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