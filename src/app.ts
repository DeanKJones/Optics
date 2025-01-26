import { Renderer } from "./render/renderer.ts";

export class App 
{
    private lastTime = 0;
    private deltaTime = 0;

    canvases: Map<string, HTMLCanvasElement>;
    renderer: Renderer;

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));

        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        this.renderer.Initialize().then(() => {
            this.run();
        });
    }

    run = () => {
        this.deltaTime = (performance.now() - this.lastTime) / 1000;
        this.lastTime = performance.now();

        var running: boolean = true;

        // Render Viewport
        this.renderer.render(this.deltaTime);

        // Request the next frame
        if (running) {
            requestAnimationFrame(this.run);
        }
    }
}