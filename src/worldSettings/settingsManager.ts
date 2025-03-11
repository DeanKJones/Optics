import { OpticsUniformSettings } from "../render/uniformDataLayouts/opticsUniformSettings";
import { VoxelSpaceSettings } from "../render/uniformDataLayouts/voxelSpaceUniformSettings";
import { EventSystem } from "../events/eventSystem";

export class SettingsManager {
    private static instance: SettingsManager;
    
    // Settings objects
    private opticsSettings: OpticsUniformSettings;
    private voxelSpaceSettings: VoxelSpaceSettings;
    
    // Rendering mode
    private _renderMode: 'wave' | 'fdtd' | 'voxelspace' = 'wave';
    
    // Event system reference
    private eventSystem: EventSystem;
    
    private constructor() {
        this.opticsSettings = new OpticsUniformSettings();
        this.voxelSpaceSettings = new VoxelSpaceSettings();
        this.eventSystem = EventSystem.getInstance();
        
        // Set up keyboard handling for VoxelSpace
        this.setupVoxelSpaceControls();
    }
    
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }
    
    private setupVoxelSpaceControls(): void {
        // Set up keyboard event handlers
        this.eventSystem.on('keydown', (event: KeyboardEvent) => {
            this.voxelSpaceSettings.handleKeyDown(event);
        });
        
        this.eventSystem.on('keyup', (event: KeyboardEvent) => {
            this.voxelSpaceSettings.handleKeyUp(event);
        });
    }
    
    public update(deltaTime: number): void {
        // Update time-based settings
        this.opticsSettings.deltaTime += deltaTime;
        
        // Update VoxelSpace camera if in VoxelSpace mode
        if (this._renderMode === 'voxelspace') {
            this.voxelSpaceSettings.update();
        }
    }
    
    // Getters for settings
    public get optics(): OpticsUniformSettings {
        return this.opticsSettings;
    }
    
    public get voxelSpace(): VoxelSpaceSettings {
        return this.voxelSpaceSettings;
    }
    
    // Render mode management
    public get renderMode(): 'wave' | 'fdtd' | 'voxelspace' {
        return this._renderMode;
    }
    
    public set renderMode(mode: 'wave' | 'fdtd' | 'voxelspace') {
        this._renderMode = mode;
    }
    
    public resetSimulation(): void {
        if (this._renderMode === 'fdtd' || this._renderMode === 'wave') {
            this.opticsSettings.deltaTime = 0.0;
        }
    }
}