import { UniformSettings } from "../render/layouts/uniformBufferSettings";
import { 
    setupSlider, 
    createControlPanel, 
    setupSettingsDisplay, 
    updateValueDisplay, 
    setSliderValue, 
    setButtonActive,
    renderSettingsUI
} from './uiUtilities';

/**
 * Manages all UI elements and their interactions with simulation settings
 */
export class UIManager {
    // Core settings and callbacks
    private settings: UniformSettings;
    private onFdtdToggle: (isEnabled: boolean) => void;
    private onResetSimulation: () => void;

    // UI element references
    private sliders: Map<string, HTMLInputElement | null> = new Map();
    private valueDisplays: Map<string, HTMLSpanElement | null> = new Map();
    private controlPanel!: HTMLDivElement;
    private settingsCanvas: HTMLCanvasElement | undefined;

    constructor(
        settings: UniformSettings,
        settingsCanvas: HTMLCanvasElement | undefined,
        onFdtdToggle: (isEnabled: boolean) => void,
        onResetSimulation: () => void
    ) {
        this.settings = settings;
        this.settingsCanvas = settingsCanvas;
        this.onFdtdToggle = onFdtdToggle;
        this.onResetSimulation = onResetSimulation;
        
        // Initialize UI components using utility functions
        this.initializeUI();
    }
    
    /**
     * Initialize all UI components
     */
    private initializeUI(): void {
        // Set up sliders
        this.initializeSliders();
        
        // Set up control panel using utility function
        this.controlPanel = createControlPanel(this.onFdtdToggle, this.onResetSimulation);
        
        // Set up settings display using utility function
        setupSettingsDisplay(this.settingsCanvas);
        
        // Initial UI update
        this.updateUIFromSettings();
    }
    
    /**
     * Initialize all slider controls
     */
    private initializeSliders(): void {
        // Set up wavelength slider
        const wavelength = setupSlider(
            "wavelength-slider",
            "wavelength-value",
            (value) => {
                this.settings.setWavelengthNm(value);
                updateValueDisplay(this.valueDisplays.get("wavelength") || null, `${value.toFixed(0)} nm`);
            }
        );
        this.sliders.set("wavelength", wavelength.slider);
        this.valueDisplays.set("wavelength", wavelength.valueDisplay);
        
        // Set up slit width slider
        const slitWidth = setupSlider(
            "slit-width-slider",
            "slit-width-value",
            (value) => {
                this.settings.setSlitWidthMm(value);
                updateValueDisplay(this.valueDisplays.get("slitWidth") || null, `${value.toFixed(3)} mm`);
            }
        );
        this.sliders.set("slitWidth", slitWidth.slider);
        this.valueDisplays.set("slitWidth", slitWidth.valueDisplay);
        
        // Set up grate width slider
        const grateWidth = setupSlider(
            "grate-width-slider",
            "grate-width-value",
            (value) => {
                this.settings.setGrateWidthMm(value);
                updateValueDisplay(this.valueDisplays.get("grateWidth") || null, `${value.toFixed(2)} mm`);
            }
        );
        this.sliders.set("grateWidth", grateWidth.slider);
        this.valueDisplays.set("grateWidth", grateWidth.valueDisplay);
        
        // Set up number of slits slider
        const numberOfSlits = setupSlider(
            "number-of-slits-slider",
            "number-of-slits-value",
            (value) => {
                this.settings.numberOfSlits = value;
                updateValueDisplay(this.valueDisplays.get("numberOfSlits") || null, `${value.toFixed(0)}`);
            }
        );
        this.sliders.set("numberOfSlits", numberOfSlits.slider);
        this.valueDisplays.set("numberOfSlits", numberOfSlits.valueDisplay);
        
        // Set up screen size slider
        const screenSize = setupSlider(
            "screen-size-mult-slider",
            "screen-size-mult-value",
            (value) => {
                this.settings.screenSize = value;
                updateValueDisplay(this.valueDisplays.get("screenSize") || null, `${value.toFixed(1)}`);
            }
        );
        this.sliders.set("screenSize", screenSize.slider);
        this.valueDisplays.set("screenSize", screenSize.valueDisplay);
    }
    
    /**
     * Update UI elements based on current settings values
     */
    public updateUIFromSettings(): void {
        // Update all value displays using utility function
        updateValueDisplay(this.valueDisplays.get("wavelength") || null, `${this.settings.getWavelengthNm().toFixed(0)} nm`);
        updateValueDisplay(this.valueDisplays.get("slitWidth") || null, `${this.settings.getSlitWidthMm().toFixed(3)} mm`);
        updateValueDisplay(this.valueDisplays.get("grateWidth") || null, `${this.settings.getGrateWidthMm().toFixed(2)} mm`);
        updateValueDisplay(this.valueDisplays.get("numberOfSlits") || null, `${this.settings.numberOfSlits.toFixed(0)}`);
        updateValueDisplay(this.valueDisplays.get("screenSize") || null, `${this.settings.screenSize.toFixed(1)}`);
        
        // Update slider positions using utility function
        setSliderValue(this.sliders.get("wavelength") || null, this.settings.getWavelengthNm());
        setSliderValue(this.sliders.get("slitWidth") || null, this.settings.getSlitWidthMm());
        setSliderValue(this.sliders.get("grateWidth") || null, this.settings.getGrateWidthMm());
        setSliderValue(this.sliders.get("numberOfSlits") || null, this.settings.numberOfSlits);
        setSliderValue(this.sliders.get("screenSize") || null, this.settings.screenSize);
    }
    
    /**
     * Set the active state of the FDTD toggle button
     */
    public setFdtdActive(active: boolean): void {
        setButtonActive(this.controlPanel, 1, active);
    }
    
    /**
     * Render the settings information on the canvas
     */
    public renderSettingsUI(): void {
        renderSettingsUI(this.settingsCanvas, this.settings);
    }
}