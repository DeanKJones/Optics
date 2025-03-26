import { EventSystem } from "../events/eventSystem";
import { VoxelWorldBufferDescription } from "../render/buffers/voxelWorldBufferDescription";

/**
 * Handles camera movement and controls for the voxel world
 */
export class VoxelWorldCameraController {
    private eventSystem: EventSystem;
    private bufferDescription: VoxelWorldBufferDescription;
    
    // Camera state
    private position: [number, number, number] = [0, 5, -15];
    private rotation: [number, number] = [0, 0]; // [pitch, yaw] in radians
    
    // Movement speed
    private movementSpeed: number = 5.0;
    private rotationSpeed: number = 0.003;
    
    // Key states
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    
    // Mouse control state
    private isMouseLookEnabled: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    
    constructor(bufferDescription: VoxelWorldBufferDescription) {
        this.eventSystem = EventSystem.getInstance();
        this.bufferDescription = bufferDescription;
        
        // Set up event handlers
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        
        // Update the camera buffer with initial position
        this.bufferDescription.updateCamera(this.position, this.rotation);
    }
    
    private setupKeyboardEvents(): void {
        // Listen for key press events
        this.eventSystem.on('keydown', (event: KeyboardEvent) => {
            this.handleKeyDown(event);
        });
        
        // Listen for key release events
        this.eventSystem.on('keyup', (event: KeyboardEvent) => {
            this.handleKeyUp(event);
        });
    }
    
    private setupMouseEvents(): void {
        // Add mouse down handler to the document
        document.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button === 0) { // Left mouse button
                this.isMouseLookEnabled = true;
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
                
                // Hide the cursor while looking around
                document.body.style.cursor = 'none';
            }
        });
        
        // Add mouse up handler to the document
        document.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button === 0) { // Left mouse button
                this.isMouseLookEnabled = false;
                
                // Restore the cursor
                document.body.style.cursor = 'auto';
            }
        });
        
        // Add mouse move handler to the document
        document.addEventListener('mousemove', (event: MouseEvent) => {
            if (this.isMouseLookEnabled) {
                const deltaX = event.clientX - this.lastMouseX;
                const deltaY = event.clientY - this.lastMouseY;
                
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
                
                // Update camera rotation based on mouse movement
                this.rotation[1] += deltaX * this.rotationSpeed; // Yaw (left/right)
                this.rotation[0] -= deltaY * this.rotationSpeed; // Pitch (up/down)
                
                // Clamp pitch to prevent camera flipping
                this.rotation[0] = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation[0]));
            }
        });
    }
    
    private handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                this.moveUp = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveDown = true;
                break;
        }
    }
    
    private handleKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveDown = false;
                break;
        }
    }
    
    /**
     * Update camera position and rotation based on input
     * @param deltaTime Time since last update in seconds
     */
    public update(deltaTime: number): void {
        // Calculate movement direction based on camera orientation
        const yaw = this.rotation[1];
        const pitch = this.rotation[0];
        
        // Calculate forward vector
        const forward = [
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
        ];
        
        // Calculate right vector
        const right = [
            Math.sin(yaw + Math.PI / 2),
            0,
            Math.cos(yaw + Math.PI / 2)
        ];
        
        // Calculate movement distance for this frame
        const distance = this.movementSpeed * deltaTime;
        
        // Apply movement based on key states
        if (this.moveForward) {
            this.position[0] += forward[0] * distance;
            this.position[1] += forward[1] * distance;
            this.position[2] += forward[2] * distance;
        }
        
        if (this.moveBackward) {
            this.position[0] -= forward[0] * distance;
            this.position[1] -= forward[1] * distance;
            this.position[2] -= forward[2] * distance;
        }
        
        if (this.moveRight) {
            this.position[0] += right[0] * distance;
            this.position[2] += right[2] * distance;
        }
        
        if (this.moveLeft) {
            this.position[0] -= right[0] * distance;
            this.position[2] -= right[2] * distance;
        }
        
        if (this.moveUp) {
            this.position[1] += distance;
        }
        
        if (this.moveDown) {
            this.position[1] -= distance;
        }
        
        // Update the camera buffer with the new position and rotation
        this.bufferDescription.updateCamera(this.position, this.rotation);
    }
    
    // Get current camera position
    public getPosition(): [number, number, number] {
        return this.position;
    }
    
    // Get current camera rotation
    public getRotation(): [number, number] {
        return this.rotation;
    }
    
    // Set camera position
    public setPosition(x: number, y: number, z: number): void {
        this.position = [x, y, z];
        this.bufferDescription.updateCamera(this.position, this.rotation);
    }
    
    // Set camera rotation (pitch, yaw)
    public setRotation(pitch: number, yaw: number): void {
        this.rotation = [pitch, yaw];
        this.bufferDescription.updateCamera(this.position, this.rotation);
    }
}