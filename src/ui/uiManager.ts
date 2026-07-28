import { EventSystem } from "../events/eventSystem";
import { RenderContext } from "../render/renderContext";

import { SettingsManager } from "../worldSettings/settingsManager";
import { RenderContextUI } from "../worldSettings/ui/renderContextUI";
import { OpticsSettingsUI } from "../worldSettings/ui/opticsSettingsUI";

/**
 * Manages UI components and coordinates between different settings UIs
 */
export class UIManager {
    // Core systems
    private settingsManager: SettingsManager;
    private eventSystem: EventSystem;
    
    // UI components for different settings
    private opticsUI: OpticsSettingsUI;
    
    // Shared UI elements
    private settingsCanvas: HTMLCanvasElement | undefined;
    
    // Render context UI
    private renderContext: RenderContext;
    private renderContextUI: RenderContextUI;

    constructor(
        settingsCanvas: HTMLCanvasElement | undefined,
        onRenderModeToggle: (mode: 'fdtd') => void,
        onResetSimulation: () => void,
        renderContext: RenderContext
    ) {
        // Initialize core systems
        this.settingsManager = SettingsManager.getInstance();
        this.eventSystem = EventSystem.getInstance();
        this.settingsCanvas = settingsCanvas;
        
        // Store render context
        this.renderContext = renderContext;
        
        // Create UI components for different settings types
        this.opticsUI = new OpticsSettingsUI(this.settingsManager.optics);
        
        // Setup shared UI components
        this.createControlPanel(onRenderModeToggle, onResetSimulation);
        
        // Initialize render context UI
        this.renderContextUI = new RenderContextUI(this.renderContext);
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize all UI components
     */
    private initializeUI(): void {
        // Set up canvas for settings display
        if (this.settingsCanvas) {
            this.settingsCanvas.width = 250;
            this.settingsCanvas.height = 300;
            this.settingsCanvas.style.border = '1px solid #333';
            this.settingsCanvas.style.marginLeft = '10px';
            this.settingsCanvas.style.marginBottom = '10px';
        }
        
        // Initialize UI components
        this.opticsUI.initialize();
        
        // Initial UI update
        this.updateUI();
    }
    
    /**
     * Create the main control panel with mode selection buttons
     */
    private createControlPanel(
        onRenderModeToggle: (mode: 'fdtd') => void,
        onResetSimulation: () => void
    ): HTMLDivElement {
        const controlPanel = document.createElement('div');
        controlPanel.className = 'nav-header';
        controlPanel.style.left = 'auto';
        controlPanel.style.right = '10px';
        controlPanel.style.bottom = '10px';
        document.body.appendChild(controlPanel);

        onRenderModeToggle('fdtd');
    
        // Reset simulation button
        const resetButton = document.createElement('a');
        resetButton.href = '#';
        resetButton.innerText = 'Reset Sim (R)';
        resetButton.id = 'reset-sim-button';
        resetButton.classList.add('active');
        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetButton.classList.add('active');
            setTimeout(() => resetButton.classList.remove('active'), 300);
            onResetSimulation();
        });
        controlPanel.appendChild(resetButton);
        
        // Set up keyboard shortcuts
        this.eventSystem.on('keydown', (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyR': 
                    onResetSimulation();
                    break;
            }
        });
        
        return controlPanel;
    }
    
    
    /**
     * Set the active mode and update UI accordingly
     */
    public setMode(mode: 'fdtd'): void {
        // Update render context
        this.renderContext.setRenderMode(mode);

        // Update parameters box title and content based on mode
        const parametersBox = document.getElementById('simulation-parameters-box');
        const parametersHeader = parametersBox?.querySelector('.parameters-header');

        if (parametersBox && parametersHeader) {
            parametersHeader.innerHTML = `
                <h2>FDTD Simulation Parameters</h2>
                <p class="description">Adjust the FDTD simulation and diffraction grating values</p>
            `;

            const parameterGroups = parametersBox.querySelectorAll('.parameter-group');
            parameterGroups.forEach(group => {
                (group as HTMLElement).style.display = 'block';
            });
        }

        // Update UI components
        this.updateUI();
    }
    
    /**
     * Update all UI elements based on current settings
     */
    public updateUI(): void {
        if (this.settingsCanvas && this.settingsCanvas.getContext('2d')) {
            const ctx = this.settingsCanvas.getContext('2d')!;
            ctx.clearRect(0, 0, this.settingsCanvas.width, this.settingsCanvas.height);
            this.opticsUI.renderUI(ctx);
        }

        this.opticsUI.updateControls();
        
        // Update render context UI
        this.renderContextUI.update();
    }
}