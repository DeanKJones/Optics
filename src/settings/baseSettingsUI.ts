/**
 * Base abstract class for settings UI components
 */
export abstract class BaseSettingsUI<T> {
    protected settings: T;
    
    constructor(settings: T) {
        this.settings = settings;
    }
    
    /**
     * Initialize UI elements specific to this settings type
     */
    abstract initialize(): void;
    
    /**
     * Update controls with current settings values
     */
    abstract updateControls(): void;
    
    /**
     * Render settings info on canvas
     */
    abstract renderUI(ctx: CanvasRenderingContext2D): void;
}