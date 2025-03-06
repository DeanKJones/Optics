// src/voxel/voxelApp.ts
import { VoxelRenderer } from "./render/voxelRenderer";
import { VoxelSceneManager } from "./scene/voxelSceneManager";
import { VoxelSettings } from "./settings/voxelSettings";

export class VoxelApp {
    canvases: Map<string, HTMLCanvasElement>;
    renderer: VoxelRenderer;
    sceneManager: VoxelSceneManager;
    settings: VoxelSettings = new VoxelSettings();
    initialized: boolean = false;
    lastTime: number = performance.now();

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));
        
        this.renderer = new VoxelRenderer(this.canvases.get("voxelMain")!);
        this.sceneManager = new VoxelSceneManager(this.renderer);
        
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Voxel Renderer initialized successfully");
            this.setupScene();
            this.setupUI();
            this.run();
        }).catch(error => {
            console.error("Failed to initialize voxel renderer:", error);
        });
    }
    
    setupScene() {
        // Create a demo cube with some missing voxels
        const demoCube = this.sceneManager.createDemoCube(
            this.settings.voxelSize, 
            this.settings.voxelDensity
        );
        
        this.sceneManager.addObject(demoCube);
    }
    
    setupUI() {
        // Voxel size slider
        const voxelSizeSlider = document.getElementById("voxel-size") as HTMLInputElement;
        const voxelSizeValue = document.getElementById("voxel-size-value") as HTMLSpanElement;
        
        voxelSizeSlider.addEventListener("input", () => {
            this.settings.voxelSize = parseFloat(voxelSizeSlider.value);
            voxelSizeValue.textContent = this.settings.voxelSize.toString();
            this.sceneManager.updateVoxelSize(this.settings.voxelSize);
        });
        
        // Voxel density slider
        const voxelDensitySlider = document.getElementById("voxel-density") as HTMLInputElement;
        const voxelDensityValue = document.getElementById("voxel-density-value") as HTMLSpanElement;
        
        voxelDensitySlider.addEventListener("input", () => {
            this.settings.voxelDensity = parseInt(voxelDensitySlider.value);
            voxelDensityValue.textContent = this.settings.voxelDensity.toString();
            this.sceneManager.updateVoxelDensity(this.settings.voxelDensity);
        });
    }
    
    run = () => {
        if (!this.initialized) {
            requestAnimationFrame(this.run);
            return;
        }
        
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000; // in seconds
        this.lastTime = now;
        
        this.sceneManager.update(deltaTime);
        this.renderer.render(this.sceneManager, this.settings); // Pass settings here
        
        requestAnimationFrame(this.run);
    }
}