import { Renderer } from "./render/renderer";
import { UIManager } from "./ui/uiManager";
import { SettingsManager } from "./worldSettings/settingsManager";
import { EventSystem } from "./events/eventSystem";
import { RenderContext } from "./render/renderContext";

export class App {
    private canvases: Map<string, HTMLCanvasElement>;
    private uiManager: UIManager;
    public ui: UIManager;
    private renderer: Renderer;
    private settingsManager: SettingsManager;
    private renderContext: RenderContext;
    private initialized: boolean = false;
    private lastTime: number = performance.now();
    private frameCount: number = 0;

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));
        
        // Initialize event system first (needed for settings manager and UI)
        EventSystem.getInstance();
        
        // Initialize settings manager
        this.settingsManager = SettingsManager.getInstance();

        // Create render context
        this.renderContext = new RenderContext();
        
        // Initialize renderer
        this.renderer = new Renderer(this.canvases.get("viewportMain")!, this.renderContext);
        
        // Initialize UI Manager with callbacks and render context
        this.uiManager = new UIManager(
            this.canvases.get("settingsMain"),
            this.handleRenderModeToggle,
            this.handleResetSimulation,
            this.renderContext
        );
        this.ui = this.uiManager;
        (window as any).app = this;
        
        // Start renderer initialization
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Renderer initialized successfully");
            
            // Set initial render context values
            this.updateRenderContextInitialValues();
            
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });
    }
    
    /**
     * Set initial values for the render context
     */
    private updateRenderContextInitialValues(): void {
        const canvas = this.canvases.get("viewportMain")!;
        this.renderContext.setResolution(canvas.width, canvas.height);
        this.renderContext.setRenderMode(this.renderer.getRenderMode());
        
        // Try to get GPU info if available
        if (this.renderer.adapter) {
            this.renderer.adapter.requestAdapterInfo().then(info => {
                const gpuInfoString = info.description || info.vendor || 'GPU';
                this.renderContext.setGpuInfo(gpuInfoString);
            });
        }
    }
    
    /**
     * Handle render mode toggle
     */
    private handleRenderModeToggle = (mode: 'wave' | 'fdtd' | 'voxelspace'): void => {
        this.renderer.setRenderMode(mode);
        this.settingsManager.renderMode = mode;
        this.renderContext.setRenderMode(mode);
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
        this.frameCount++;
        
        // Update render context with frame data
        this.renderContext.update(deltaTime);
        
        // Update simulation with delta time
        this.renderer.render(deltaTime);
        
        // Update UI
        this.uiManager.updateUI();
            
        requestAnimationFrame(this.run);
    }
}