import { Renderer } from "./render/renderer.ts";
import { UniformSettings } from "./render/layouts/uniformBufferSettings.ts";

export class App 
{
    canvases: Map<string, HTMLCanvasElement>;
    renderer: Renderer;
    settings: UniformSettings = new UniformSettings();
    initialized: boolean = false;
    lastTime: number = performance.now();

    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));

        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        this.renderer.Initialize().then(() => {
            this.initialized = true;
            console.log("Renderer initialized successfully");
            this.run();
        }).catch(error => {
            console.error("Failed to initialize renderer:", error);
        });

        // Reference to value display spans
        const wavelengthValue = document.getElementById("wavelength-value") as HTMLSpanElement;
        const slitWidthValue = document.getElementById("slit-width-value") as HTMLSpanElement;
        const grateWidthValue = document.getElementById("grate-width-value") as HTMLSpanElement;
        const numberOfSlitsValue = document.getElementById("number-of-slits-value") as HTMLSpanElement;
        const screenSizeValue = document.getElementById("screen-size-mult-value") as HTMLSpanElement;

        // Wavelength slider (converted from frequency)
        const wavelengthSlider = document.getElementById("wavelength-slider") as HTMLInputElement;
        wavelengthSlider.addEventListener("input", () => {
            const wavelength = parseFloat(wavelengthSlider.value);
            this.settings.setWavelengthNm(wavelength);
            wavelengthValue.textContent = `${wavelength.toFixed(0)} nm`;
        });
        
        // Slit width slider in mm
        const slitWidthSlider = document.getElementById("slit-width-slider") as HTMLInputElement;
        slitWidthSlider.addEventListener("input", () => {
            const widthMm = parseFloat(slitWidthSlider.value);
            this.settings.setSlitWidthMm(widthMm);
            slitWidthValue.textContent = `${widthMm.toFixed(3)} mm`;
        });
        
        // Grate width slider in mm
        const grateWidthSlider = document.getElementById("grate-width-slider") as HTMLInputElement;
        grateWidthSlider.addEventListener("input", () => {
            const widthMm = parseFloat(grateWidthSlider.value);
            this.settings.setGrateWidthMm(widthMm);
            grateWidthValue.textContent = `${widthMm.toFixed(2)} mm`;
        });
        
        // Number of slits slider
        const numberOfSlitsSlider = document.getElementById("number-of-slits-slider") as HTMLInputElement;
        numberOfSlitsSlider.addEventListener("input", () => {
            const numSlits = parseFloat(numberOfSlitsSlider.value);
            this.settings.numberOfSlits = numSlits;
            numberOfSlitsValue.textContent = `${numSlits.toFixed(0)}`;
        });
        
        // Screen size slider
        const screenSizeSlider = document.getElementById("screen-size-mult-slider") as HTMLInputElement;
        screenSizeSlider.addEventListener("input", () => {
            const size = parseFloat(screenSizeSlider.value);
            this.settings.screenSize = size;
            screenSizeValue.textContent = `${size.toFixed(1)}`;
        });

        // Initialize value displays
        wavelengthValue.textContent = `${this.settings.getWavelengthNm().toFixed(0)} nm`;
        slitWidthValue.textContent = `${this.settings.getSlitWidthMm().toFixed(3)} mm`;
        grateWidthValue.textContent = `${this.settings.getGrateWidthMm().toFixed(2)} mm`;
        numberOfSlitsValue.textContent = `${this.settings.numberOfSlits.toFixed(0)}`;
        screenSizeValue.textContent = `${this.settings.screenSize.toFixed(1)}`;

        // Create a small control panel for simulation controls
        const controlPanel = document.createElement('div');
        controlPanel.className = 'nav-header';
        controlPanel.style.left = 'auto';
        controlPanel.style.right = '10px';
        controlPanel.style.bottom = '10px';
        document.body.appendChild(controlPanel);

        // Add FDTD toggle button with navigation-like styling
        const simulationTypeToggle = document.createElement('a');
        simulationTypeToggle.href = '#';
        simulationTypeToggle.innerText = 'Toggle FDTD';
        controlPanel.appendChild(simulationTypeToggle);

        // Add reset button with navigation-like styling
        const resetButton = document.createElement('a');
        resetButton.href = '#';
        resetButton.innerText = 'Reset Sim';
        controlPanel.appendChild(resetButton);

        // Add event listeners
        simulationTypeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.renderer.useFdtdSimulation = !this.renderer.useFdtdSimulation;
            
            // Update active state on buttons
            if (this.renderer.useFdtdSimulation) {
                simulationTypeToggle.classList.add('active');
            } else {
                simulationTypeToggle.classList.remove('active');
            }
        });

        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset the simulation fields
            if (this.renderer.useFdtdSimulation) {
                this.renderer.resetFdtdSimulation();
                
                // Visual feedback for button press
                resetButton.classList.add('active');
                setTimeout(() => resetButton.classList.remove('active'), 300);

                this.settings.deltaTime = 0.0;
            }
        });

        // Set up the settings canvas with proper dimensions
        const settingsCanvas = this.canvases.get("settingsMain");
        if (settingsCanvas) {
            settingsCanvas.width = 250;  // Match width to slider container
            settingsCanvas.height = 220; // Enough for all settings
            settingsCanvas.style.border = '1px solid #333';
            settingsCanvas.style.marginLeft = '10px';
            settingsCanvas.style.marginBottom = '10px';
        }

        // Create container to hold both settings canvas and sliders
        const settingsContainer = document.getElementById("scene-container");
        if (settingsContainer) {
            // Add a title for the settings display
            const settingsTitle = document.createElement('h3');
            settingsTitle.textContent = "Current Settings";
            settingsTitle.style.marginLeft = '10px';
            settingsTitle.style.marginBottom = '5px';
            
            // Reorganize elements
            const sliderContainer = document.getElementById("settings-slider-container");
            if (sliderContainer) {
                sliderContainer.style.marginLeft = '10px';
                sliderContainer.style.marginTop = '20px';
            }
        }
    }

    run = () => {
        // Check if initialized before rendering
        if (!this.initialized) {
            console.warn("Waiting for initialization...");
            requestAnimationFrame(this.run);
            return;
        }

        // Update time for our simulation
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        // Update simulation time
        this.settings.deltaTime += deltaTime * 0.001; // Convert to seconds
        
        // Only render if initialized
        this.renderer.render(this.settings);

        const settingsCanvas = this.canvases.get("settingsMain");
        if (settingsCanvas) {
            const ctx = settingsCanvas.getContext("2d");
            if (ctx) {
                this.settings.renderSettingsUI(ctx);
            }
        }
            
        requestAnimationFrame(this.run);
    }

    tickTimeForward = () => {
        this.settings.deltaTime += 0.01; // Delta Time speed
    }
}