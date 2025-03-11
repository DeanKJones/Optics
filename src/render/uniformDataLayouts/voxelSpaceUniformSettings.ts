export class VoxelSpaceSettings {
    // Camera position and orientation
    positionX: number = 500; 
    positionY: number = 500;
    height: number = 100;  // Camera height above ground
    angle: number = 0;     // Camera angle in radians
    
    // Rendering parameters
    horizon: number = 100;  // Horizon position (pixels from top)
    scale: number = 240;    // Scale factor for height
    distance: number = 800; // Draw distance
    
    // Movement controls
    moveSpeed: number = 5;
    turnSpeed: number = 0.05;
    
    // Movement state
    moveForward: boolean = false;
    moveBackward: boolean = false;
    turnLeft: boolean = false;
    turnRight: boolean = false;
    moveUp: boolean = false;
    moveDown: boolean = false;
    
    constructor() {
        // Default initialization
    }
    
    update(): void {
        // Update position and orientation based on movement state
        if (this.moveForward) {
            this.positionX += Math.sin(this.angle) * this.moveSpeed;
            this.positionY += Math.cos(this.angle) * this.moveSpeed;
        }
        if (this.moveBackward) {
            this.positionX -= Math.sin(this.angle) * this.moveSpeed;
            this.positionY -= Math.cos(this.angle) * this.moveSpeed;
        }
        if (this.turnLeft) {
            this.angle -= this.turnSpeed;
        }
        if (this.turnRight) {
            this.angle += this.turnSpeed;
        }
        if (this.moveUp && this.height < 300) {
            this.height += 2;
        }
        if (this.moveDown && this.height > 20) {
            this.height -= 2;
        }
        
        // Ensure position wraps around the map (1024x1024)
        this.positionX = ((this.positionX % 1024) + 1024) % 1024;
        this.positionY = ((this.positionY % 1024) + 1024) % 1024;
    }
    
    // Function to serialize to GPU buffer
    toFloatArray(): Float32Array {
        return new Float32Array([
            this.positionX,
            this.positionY,
            this.height,
            this.angle,
            this.horizon,
            this.scale,
            this.distance,
            0.0, // Padding
        ]);
    }
    
    // Function to handle keyboard input
    handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.turnLeft = true; break;
            case 'KeyD': this.turnRight = true; break;
            case 'KeyQ': this.moveUp = true; break;
            case 'KeyE': this.moveDown = true; break;
        }
    }
    
    handleKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.turnLeft = false; break;
            case 'KeyD': this.turnRight = false; break;
            case 'KeyQ': this.moveUp = false; break;
            case 'KeyE': this.moveDown = false; break;
        }
    }
    
    // UI rendering for settings display
    renderSettingsUI(ctx: CanvasRenderingContext2D): void {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        
        ctx.fillText('VoxelSpace Settings', 10, 10);
        ctx.font = '12px Arial';
        
        ctx.fillText(`Position: X=${Math.floor(this.positionX)}, Y=${Math.floor(this.positionY)}`, 10, 40);
        ctx.fillText(`Height: ${Math.floor(this.height)}`, 10, 60);
        ctx.fillText(`Angle: ${(this.angle * 180 / Math.PI).toFixed(1)}°`, 10, 80);
        ctx.fillText(`Draw Distance: ${this.distance}`, 10, 100);
        ctx.fillText(`Controls: W/S - Move, A/D - Turn, Q/E - Height`, 10, 140);
    }
}