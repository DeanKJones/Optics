import { Renderer } from "./render/renderer";
import { UniformSettings } from "./render/layouts/uniformBufferSettings";
import { UIManager } from "./ui/uiManager";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;
    private renderer: Renderer;
    private settings: UniformSettings = new UniformSettings();
    private uiManager: UIManager;
    private initialized: boolean = false;
    private lastTime: number = performance.now();

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));

        // Initialize renderer
        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        
        // Initialize UI Manager with callbacks
        this.uiManager = new UIManager(
            this.settings,
            this.canvases.get("settingsMain"),
            this.handleFdtdToggle,
            this.handleResetSimulation
        );
        
        // Start renderer initialization
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Renderer initialized successfully");
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });
    }
    
    /**
     * Handle FDTD simulation toggle
     */
    private handleFdtdToggle = (isEnabled: boolean): void => {
        this.renderer.useFdtdSimulation = isEnabled;
    }
    
    /**
     * Handle simulation reset
     */
    private handleResetSimulation = (): void => {
        if (this.renderer.useFdtdSimulation) {
            this.renderer.resetFdtdSimulation();
            this.settings.deltaTime = 0.0;
        }
    }

    /**
     * Main animation loop
     */
    public run = (): void => {
        // Check if initialized before rendering
        if (!this.initialized) {
            console.warn("Waiting for initialization...");
            requestAnimationFrame(this.run);
            return;
        }

        // Update time for our simulation
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        // Update simulation time
        this.settings.deltaTime += deltaTime * 0.001; // Convert to seconds
        
        // Update the simulation
        this.renderer.render(this.settings);
        
        // Update settings UI
        this.uiManager.renderSettingsUI();
            
        requestAnimationFrame(this.run);
    }
}