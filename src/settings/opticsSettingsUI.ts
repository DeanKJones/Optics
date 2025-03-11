import { OpticsUniformSettings } from "../render/layouts/opticsUniformSettings";
import { BaseSettingsUI } from "./baseSettingsUI";

export class OpticsSettingsUI extends BaseSettingsUI<OpticsUniformSettings> {
    private sliders: Map<string, HTMLInputElement | null> = new Map();
    private valueDisplays: Map<string, HTMLSpanElement | null> = new Map();
    
    constructor(settings: OpticsUniformSettings) {
        super(settings);
    }
    
    initialize(): void {
        this.setupWavelengthSlider();
        this.setupSlitWidthSlider();
        this.setupGrateWidthSlider();
        this.setupNumberOfSlitsSlider();
        this.setupScreenSizeSlider();
    }
    
    updateControls(): void {
        // Update all sliders and displays with current values
        this.updateValueDisplay("wavelength", `${this.settings.getWavelengthNm().toFixed(0)} nm`);
        this.updateValueDisplay("slit-width", `${this.settings.getSlitWidthMm().toFixed(3)} mm`);
        this.updateValueDisplay("grate-width", `${this.settings.getGrateWidthMm().toFixed(2)} mm`);
        this.updateValueDisplay("number-of-slits", `${this.settings.numberOfSlits}`);
        this.updateValueDisplay("screen-size-mult", `${this.settings.screenSize}`);
        
        this.setSliderValue("wavelength", this.settings.getWavelengthNm());
        this.setSliderValue("slit-width", this.settings.getSlitWidthMm());
        this.setSliderValue("grate-width", this.settings.getGrateWidthMm());
        this.setSliderValue("number-of-slits", this.settings.numberOfSlits);
        this.setSliderValue("screen-size-mult", this.settings.screenSize);
    }
    
    renderUI(ctx: CanvasRenderingContext2D): void {
        this.settings.renderSettingsUI(ctx);
    }
    
    // Helper methods for slider setup
    private setupWavelengthSlider(): void {
        const slider = document.getElementById("wavelength-slider") as HTMLInputElement;
        const valueDisplay = document.getElementById("wavelength-value") as HTMLSpanElement;
        
        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setWavelengthNm(value);
                this.updateValueDisplay("wavelength", `${value.toFixed(0)} nm`);
            });
            
            this.sliders.set("wavelength", slider);
            this.valueDisplays.set("wavelength", valueDisplay);
        }
    }
    
    private setupSlitWidthSlider(): void {
        const slider = document.getElementById("slit-width-slider") as HTMLInputElement;
        const valueDisplay = document.getElementById("slit-width-value") as HTMLSpanElement;
        
        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setSlitWidthMm(value);
                this.updateValueDisplay("slit-width", `${value.toFixed(3)} mm`);
            });
            
            this.sliders.set("slit-width", slider);
            this.valueDisplays.set("slit-width", valueDisplay);
        }
    }
    
    private setupGrateWidthSlider(): void {
        const slider = document.getElementById("grate-width-slider") as HTMLInputElement;
        const valueDisplay = document.getElementById("grate-width-value") as HTMLSpanElement;
        
        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setGrateWidthMm(value);
                this.updateValueDisplay("grate-width", `${value.toFixed(2)} mm`);
            });
            
            this.sliders.set("grate-width", slider);
            this.valueDisplays.set("grate-width", valueDisplay);
        }
    }
    
    private setupNumberOfSlitsSlider(): void {
        const slider = document.getElementById("number-of-slits-slider") as HTMLInputElement;
        const valueDisplay = document.getElementById("number-of-slits-value") as HTMLSpanElement;
        
        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.numberOfSlits = value;
                this.updateValueDisplay("number-of-slits", `${value}`);
            });
            
            this.sliders.set("number-of-slits", slider);
            this.valueDisplays.set("number-of-slits", valueDisplay);
        }
    }
    
    private setupScreenSizeSlider(): void {
        const slider = document.getElementById("screen-size-mult-slider") as HTMLInputElement;
        const valueDisplay = document.getElementById("screen-size-mult-value") as HTMLSpanElement;
        
        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.screenSize = value;
                this.updateValueDisplay("screen-size-mult", `${value.toFixed(1)}`);
            });
            
            this.sliders.set("screen-size-mult", slider);
            this.valueDisplays.set("screen-size-mult", valueDisplay);
        }
    }
    
    // UI helper methods
    private updateValueDisplay(id: string, text: string): void {
        const element = this.valueDisplays.get(id);
        if (element) {
            element.textContent = text;
        }
    }
    
    private setSliderValue(id: string, value: number): void {
        const slider = this.sliders.get(id);
        if (slider) {
            slider.value = value.toString();
        }
    }
}