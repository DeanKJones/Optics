import { VoxelSpaceSettings } from "../render/layouts/voxelSpaceUniformSettings";
import { BaseSettingsUI } from "./baseSettingsUI";

export class VoxelSpaceSettingsUI extends BaseSettingsUI<VoxelSpaceSettings> {
    constructor(settings: VoxelSpaceSettings) {
        super(settings);
    }
    
    initialize(): void {
        // VoxelSpace doesn't need sliders, it uses keyboard controls
        // But we could add customization options here in the future
    }
    
    updateControls(): void {
        // Currently no sliders to update for VoxelSpace
        // This method would update any UI controls if they existed
    }
    
    renderUI(ctx: CanvasRenderingContext2D): void {
        this.settings.renderSettingsUI(ctx);
    }
}