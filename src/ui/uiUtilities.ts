import { OpticsUniformSettings } from "../render/layouts/opticsUniformSettings";

/**
 * Sets up a slider element with event listener
 */
export function setupSlider(
    sliderId: string,
    valueElementId: string,
    onChange: (value: number) => void
): { slider: HTMLInputElement | null, valueDisplay: HTMLSpanElement | null } {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const valueDisplay = document.getElementById(valueElementId) as HTMLSpanElement;
    
    if (!slider) {
        console.error(`Slider element not found: ${sliderId}`);
        return { slider: null, valueDisplay };
    }
    
    slider.addEventListener("input", () => {
        const value = parseFloat(slider.value);
        onChange(value);
    });
    
    return { slider, valueDisplay };
}

/**
 * Creates and sets up the simulation control panel
 */
export function createControlPanel(
    onFdtdToggle: (isEnabled: boolean) => void,
    onResetSimulation: () => void
): HTMLDivElement {
    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'nav-header';
    controlPanel.style.left = 'auto';
    controlPanel.style.right = '10px';
    controlPanel.style.bottom = '10px';
    document.body.appendChild(controlPanel);
    
    // FDTD toggle button
    const simulationTypeToggle = document.createElement('a');
    simulationTypeToggle.href = '#';
    simulationTypeToggle.innerText = 'Toggle FDTD';
    controlPanel.appendChild(simulationTypeToggle);
    
    // Reset simulation button
    const resetButton = document.createElement('a');
    resetButton.href = '#';
    resetButton.innerText = 'Reset Sim';
    controlPanel.appendChild(resetButton);
    
    // Add event listeners
    simulationTypeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isActive = simulationTypeToggle.classList.contains('active');
        
        if (isActive) {
            simulationTypeToggle.classList.remove('active');
        } else {
            simulationTypeToggle.classList.add('active');
        }
        
        onFdtdToggle(!isActive);
    });
    
    resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Visual feedback for button press
        resetButton.classList.add('active');
        setTimeout(() => resetButton.classList.remove('active'), 300);
        
        onResetSimulation();
    });
    
    return controlPanel;
}

/**
 * Sets up the settings display canvas and container
 */
export function setupSettingsDisplay(settingsCanvas: HTMLCanvasElement | undefined): void {
    // Set up the settings canvas with proper dimensions
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

/**
 * Updates a specific value display element
 */
export function updateValueDisplay(element: HTMLSpanElement | null, text: string): void {
    if (element) {
        element.textContent = text;
    }
}

/**
 * Set a slider's value
 */
export function setSliderValue(slider: HTMLInputElement | null, value: number): void {
    if (slider) {
        slider.value = value.toString();
    }
}

/**
 * Set the active state of the FDTD toggle button
 */
export function setButtonActive(controlPanel: HTMLDivElement, buttonIndex: number, active: boolean): void {
    const button = controlPanel.querySelector(`a:nth-child(${buttonIndex})`);
    if (button) {
        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
}

/**
 * Render the settings on a canvas
 */
export function renderSettingsUI(canvas: HTMLCanvasElement | undefined, settings: OpticsUniformSettings): void {
    if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            settings.renderSettingsUI(ctx);
        }
    }
}