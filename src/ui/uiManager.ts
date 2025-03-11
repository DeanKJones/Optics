import { EventSystem } from "../events/eventSystem";
import { SettingsManager } from "../settings/settingsManager";
import { OpticsSettingsUI } from "../settings/opticsSettingsUI";
import { VoxelSpaceSettingsUI } from "../settings/voxelSpaceSettingsUI";

/**
 * Manages UI components and coordinates between different settings UIs
 */
export class UIManager {
    // Core systems
    private settingsManager: SettingsManager;
    private eventSystem: EventSystem;
    
    // UI components for different settings
    private opticsUI: OpticsSettingsUI;
    private voxelSpaceUI: VoxelSpaceSettingsUI;
    
    // Shared UI elements
    private controlPanel: HTMLDivElement;
    private settingsCanvas: HTMLCanvasElement | undefined;
    private keyInstructions: HTMLDivElement;
    
    // Current active mode
    private currentMode: 'wave' | 'fdtd' | 'voxelspace' = 'wave';

    constructor(
        settingsCanvas: HTMLCanvasElement | undefined,
        onRenderModeToggle: (mode: 'wave' | 'fdtd' | 'voxelspace') => void,
        onResetSimulation: () => void
    ) {
        // Initialize core systems
        this.settingsManager = SettingsManager.getInstance();
        this.eventSystem = EventSystem.getInstance();
        this.settingsCanvas = settingsCanvas;
        
        // Create UI components for different settings types
        this.opticsUI = new OpticsSettingsUI(this.settingsManager.optics);
        this.voxelSpaceUI = new VoxelSpaceSettingsUI(this.settingsManager.voxelSpace);
        
        // Setup shared UI components
        this.controlPanel = this.createControlPanel(onRenderModeToggle, onResetSimulation);
        this.keyInstructions = this.createKeyInstructions();
        
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
            this.settingsCanvas.height = 220;
            this.settingsCanvas.style.border = '1px solid #333';
            this.settingsCanvas.style.marginLeft = '10px';
            this.settingsCanvas.style.marginBottom = '10px';
        }
        
        // Initialize UI components
        this.opticsUI.initialize();
        this.voxelSpaceUI.initialize();
        
        // Initial UI update
        this.updateUI();
    }
    
    /**
     * Create the main control panel with mode selection buttons
     */
    private createControlPanel(
        onRenderModeToggle: (mode: 'wave' | 'fdtd' | 'voxelspace') => void,
        onResetSimulation: () => void
    ): HTMLDivElement {
        const controlPanel = document.createElement('div');
        controlPanel.className = 'nav-header';
        controlPanel.style.left = 'auto';
        controlPanel.style.right = '10px';
        controlPanel.style.bottom = '10px';
        document.body.appendChild(controlPanel);
        
        // Create mode buttons with common structure
        const createModeButton = (
            label: string, 
            mode: 'wave' | 'fdtd' | 'voxelspace',
            shortcut: string,
            isActive: boolean = false
        ) => {
            const button = document.createElement('a');
            button.href = '#';
            button.innerText = `${label} (${shortcut})`;
            if (isActive) button.classList.add('active');
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.setMode(mode);
                onRenderModeToggle(mode);
            });
            
            controlPanel.appendChild(button);
            return button;
        };
        
        // Create the mode buttons
        createModeButton('Wave', 'wave', '1', true);
        createModeButton('FDTD', 'fdtd', '2');

        // Reset simulation button
        const resetButton = document.createElement('a');
        resetButton.href = '#';
        resetButton.innerText = 'Reset Sim (R)';
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
                case 'Digit1': 
                    this.setMode('wave');
                    onRenderModeToggle('wave');
                    break;
                case 'Digit2': 
                    this.setMode('fdtd');
                    onRenderModeToggle('fdtd');
                    break;
                case 'KeyR': 
                    onResetSimulation();
                    break;
            }
        });
        
        return controlPanel;
    }
    
    /**
     * Create the key instructions display
     */
    private createKeyInstructions(): HTMLDivElement {
        const instructions = document.createElement('div');
        instructions.className = 'key-instructions';
        instructions.style.position = 'fixed';
        instructions.style.left = '10px';
        instructions.style.top = '10px';
        instructions.style.backgroundColor = 'rgba(0,0,0,0.6)';
        instructions.style.padding = '5px';
        instructions.style.borderRadius = '3px';
        instructions.style.display = 'none';
        document.body.appendChild(instructions);
        return instructions;
    }
    
    /**
     * Set the active mode and update UI accordingly
     */
    public setMode(mode: 'wave' | 'fdtd' | 'voxelspace'): void {
        this.currentMode = mode;
        
        // Update button states
        const buttons = this.controlPanel.querySelectorAll('a');
        buttons.forEach((button, i) => {
            if ((mode === 'wave' && i === 0) || 
                (mode === 'fdtd' && i === 1) || 
                (mode === 'voxelspace' && i === 2)) {
                button.classList.add('active');
            } else if (i < 3) { // Skip the reset button
                button.classList.remove('active');
            }
        });
        
        // Show/hide key instructions
        if (mode === 'voxelspace') {
            this.keyInstructions.innerHTML = 'VoxelSpace Controls: W/S - Move, A/D - Turn, Q/E - Height';
            this.keyInstructions.style.display = 'block';
        } else {
            this.keyInstructions.style.display = 'none';
        }
        
        // Update UI components
        this.updateUI();
    }
    
    /**
     * Update all UI elements based on current settings
     */
    public updateUI(): void {
        // Delegate to appropriate UI component based on mode
        if (this.settingsCanvas && this.settingsCanvas.getContext('2d')) {
            const ctx = this.settingsCanvas.getContext('2d')!;
            ctx.clearRect(0, 0, this.settingsCanvas.width, this.settingsCanvas.height);
            
            if (this.currentMode === 'voxelspace') {
                this.voxelSpaceUI.renderUI(ctx);
            } else {
                this.opticsUI.renderUI(ctx);
            }
        }
        
        // Update slider values
        if (this.currentMode === 'voxelspace') {
            this.voxelSpaceUI.updateControls();
        } else {
            this.opticsUI.updateControls();
        }
    }
}