import { Renderer } from "./render/renderer";
import { UIManager } from "./ui/uiManager";
import { SettingsManager } from "./settings/settingsManager";
import { EventSystem } from "./events/eventSystem";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;
    private uiManager: UIManager;
    public ui: UIManager;
    private renderer: Renderer;
    private settingsManager: SettingsManager;
    private initialized: boolean = false;
    private lastTime: number = performance.now();

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));
        
        // Initialize event system first (needed for settings manager and UI)
        EventSystem.getInstance();
        
        // Initialize settings manager
        this.settingsManager = SettingsManager.getInstance();

        // Initialize renderer
        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        
        // Initialize UI Manager with callbacks
        this.uiManager = new UIManager(
            this.canvases.get("settingsMain"),
            this.handleRenderModeToggle,
            this.handleResetSimulation
        );
        this.ui = this.uiManager;
        (window as any).app = this;
        
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
     * Handle render mode toggle
     */
    private handleRenderModeToggle = (mode: 'wave' | 'fdtd' | 'voxelspace'): void => {
        this.renderer.setRenderMode(mode);
        this.settingsManager.renderMode = mode;
    }
    
    /**
     * Handle simulation reset
     */
    private handleResetSimulation = (): void => {
        this.settingsManager.resetSimulation();
        
        if (this.renderer.getRenderMode() === 'fdtd') {
            this.renderer.resetFdtdSimulation();
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

        // Calculate delta time
        const now = performance.now();
        const deltaTime = (now - this.lastTime) * 0.001; // Convert to seconds
        this.lastTime = now;
        
        // Update simulation with delta time
        this.renderer.render(deltaTime);
        
        // Update UI
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}