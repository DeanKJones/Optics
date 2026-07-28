import { OpticsUniformSettings } from "../render/uniformDataLayouts/opticsUniformSettings";

export class SettingsManager {
    private static instance: SettingsManager;
    
    // Settings objects
    private opticsSettings: OpticsUniformSettings;
    
    // Rendering mode
    private _renderMode: 'fdtd' = 'fdtd';
    
    private constructor() {
        this.opticsSettings = new OpticsUniformSettings();
    }
    
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }
    
    public update(deltaTime: number): void {
        // Update time-based settings
        this.opticsSettings.deltaTime += deltaTime;
    }
    
    // Getters for settings
    public get optics(): OpticsUniformSettings {
        return this.opticsSettings;
    }
    
    public get renderMode(): 'fdtd' {
        return this._renderMode;
    }
    
    public set renderMode(mode: 'fdtd') {
        this._renderMode = mode;
    }
    
    public resetSimulation(): void {
        this.opticsSettings.deltaTime = 0.0;
    }
}