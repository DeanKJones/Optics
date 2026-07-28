import {
    OpticsUniformSettings,
    WaveEmitterDirection,
} from "../../render/uniformDataLayouts/opticsUniformSettings";
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
        this.setupSlitPositionSlider();
        this.setupSlitThicknessSlider();
        this.setupSlitPlaneAbsorptionSlider();
        this.setupPropagationDirectionSelect();
        this.setupEmitterAmplitudeSlider();
        this.setupEmitterColorInputs();
    }
    
    updateControls(): void {
        // Update all sliders and displays with current values
        this.updateValueDisplay("wavelength", `${this.settings.getWavelengthNm().toFixed(0)} nm`);
        this.updateValueDisplay("slit-width", `${this.settings.getSlitWidthMm().toFixed(3)} mm`);
        this.updateValueDisplay("grate-width", `${this.settings.getGrateWidthMm().toFixed(2)} mm`);
        this.updateValueDisplay("number-of-slits", `${this.settings.numberOfSlits}`);
        this.updateValueDisplay("screen-size-mult", `${this.settings.screenSize}`);
        this.updateValueDisplay("slit-position", `${(this.settings.getSlitPositionY() * 100).toFixed(1)}%`);
        this.updateValueDisplay("slit-thickness", `${(this.settings.getSlitThickness() * 100).toFixed(2)}%`);
        this.updateValueDisplay("slit-plane-absorption", `${(this.settings.slitPlaneAbsorption * 100).toFixed(0)}%`);
        this.updateValueDisplay("emitter-amplitude", `${this.settings.emitterAmplitude.toFixed(1)}`);
        
        this.setSliderValue("wavelength", this.settings.getWavelengthNm());
        this.setSliderValue("slit-width", this.settings.getSlitWidthMm());
        this.setSliderValue("grate-width", this.settings.getGrateWidthMm());
        this.setSliderValue("number-of-slits", this.settings.numberOfSlits);
        this.setSliderValue("screen-size-mult", this.settings.screenSize);
        this.setSliderValue("slit-position", this.settings.getSlitPositionY());
        this.setSliderValue("slit-thickness", this.settings.getSlitThickness());
        this.setSliderValue("slit-plane-absorption", this.settings.slitPlaneAbsorption);
        this.setSliderValue("emitter-amplitude", this.settings.emitterAmplitude);

        this.setSelectValue("propagation-direction", this.settings.propagationDirection.toString());
        this.setColorValue("positive-color", this.settings.getPositiveColorHex());
        this.setColorValue("negative-color", this.settings.getNegativeColorHex());
    }
    
    renderUI(ctx: CanvasRenderingContext2D): void {
        this.settings.renderSettingsUI(ctx);
    }
    
    // Helper methods for slider setup
    private setupWavelengthSlider(): void {
        const slider = this.getControlElement<HTMLInputElement>("wavelength-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("wavelength-value");
        
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
        const slider = this.getControlElement<HTMLInputElement>("slit-width-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("slit-width-value");
        
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
        const slider = this.getControlElement<HTMLInputElement>("grate-width-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("grate-width-value");
        
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
        const slider = this.getControlElement<HTMLInputElement>("number-of-slits-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("number-of-slits-value");
        
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
        const slider = this.getControlElement<HTMLInputElement>("screen-size-mult-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("screen-size-mult-value");
        
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

    private setupSlitPositionSlider(): void {
        const slider = this.getControlElement<HTMLInputElement>("slit-position-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("slit-position-value");

        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setSlitPositionY(value);
                this.updateValueDisplay("slit-position", `${(value * 100).toFixed(1)}%`);
            });

            this.sliders.set("slit-position", slider);
            this.valueDisplays.set("slit-position", valueDisplay);
        }
    }

    private setupSlitThicknessSlider(): void {
        const slider = this.getControlElement<HTMLInputElement>("slit-thickness-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("slit-thickness-value");

        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setSlitThickness(value);
                this.updateValueDisplay("slit-thickness", `${(value * 100).toFixed(2)}%`);
            });

            this.sliders.set("slit-thickness", slider);
            this.valueDisplays.set("slit-thickness", valueDisplay);
        }
    }

    private setupSlitPlaneAbsorptionSlider(): void {
        const slider = this.getControlElement<HTMLInputElement>("slit-plane-absorption-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("slit-plane-absorption-value");

        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setSlitPlaneAbsorption(value);
                this.updateValueDisplay("slit-plane-absorption", `${(value * 100).toFixed(0)}%`);
            });

            this.sliders.set("slit-plane-absorption", slider);
            this.valueDisplays.set("slit-plane-absorption", valueDisplay);
        }
    }

    private setupPropagationDirectionSelect(): void {
        const select = this.getControlElement<HTMLSelectElement>("propagation-direction-select");
        if (select) {
            select.addEventListener("change", () => {
                const value = parseInt(select.value, 10);
                this.settings.setPropagationDirection(value as WaveEmitterDirection);
            });
        }
    }

    private setupEmitterAmplitudeSlider(): void {
        const slider = this.getControlElement<HTMLInputElement>("emitter-amplitude-slider");
        const valueDisplay = this.getControlElement<HTMLSpanElement>("emitter-amplitude-value");

        if (slider) {
            slider.addEventListener("input", () => {
                const value = parseFloat(slider.value);
                this.settings.setEmitterAmplitude(value);
                this.updateValueDisplay("emitter-amplitude", `${value.toFixed(1)}`);
            });

            this.sliders.set("emitter-amplitude", slider);
            this.valueDisplays.set("emitter-amplitude", valueDisplay);
        }
    }

    private setupEmitterColorInputs(): void {
        const positiveColorInput = this.getControlElement<HTMLInputElement>("positive-color-input");
        const negativeColorInput = this.getControlElement<HTMLInputElement>("negative-color-input");

        if (positiveColorInput) {
            positiveColorInput.addEventListener("input", () => {
                this.settings.setPositiveColor(this.hexToRgb(positiveColorInput.value));
            });
        }

        if (negativeColorInput) {
            negativeColorInput.addEventListener("input", () => {
                this.settings.setNegativeColor(this.hexToRgb(negativeColorInput.value));
            });
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

    private setSelectValue(id: string, value: string): void {
        const select = this.getControlElement<HTMLSelectElement>(`${id}-select`);
        if (select) {
            select.value = value;
        }
    }

    private setColorValue(id: string, value: string): void {
        const input = this.getControlElement<HTMLInputElement>(`${id}-input`);
        if (input) {
            input.value = value;
        }
    }

    private getControlElement<T extends HTMLElement>(id: string): T | null {
        const activePanel = document.querySelector('.parameter-panel.active') as HTMLElement | null;
        const scopedElement = activePanel?.querySelector(`#${id}`) as T | null;
        return scopedElement ?? document.getElementById(id) as T | null;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const value = hex.replace('#', '');
        const r = parseInt(value.slice(0, 2), 16) / 255;
        const g = parseInt(value.slice(2, 4), 16) / 255;
        const b = parseInt(value.slice(4, 6), 16) / 255;
        return { r, g, b };
    }
}