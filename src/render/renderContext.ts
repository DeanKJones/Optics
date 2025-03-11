/**
 * Stores and manages rendering context information for UI display
 */
export class RenderContext {
    // Performance metrics
    private frameCount: number = 0;
    private deltaTime: number = 0;
    private fps: number = 0;
    private fpsUpdateInterval: number = 0.5; // Update FPS every 0.5 seconds
    private fpsAccumulator: number = 0;
    private frameAccumulator: number = 0;
    
    // Render state information
    private currentRenderMode: 'wave' | 'fdtd' | 'voxelspace' = 'wave';
    private currentRenderPass: string = '';
    
    // Additional renderer details
    private renderResolution: { width: number, height: number } = { width: 0, height: 0 };
    private gpuInfo: string = '';
    
    // Custom properties for specific rendering modes
    private customMetrics: Map<string, any> = new Map();
    
    /**
     * Update the render context with new frame information
     */
    public update(deltaTime: number): void {
        this.deltaTime = deltaTime;
        this.frameCount++;
        
        // Calculate FPS
        this.frameAccumulator++;
        this.fpsAccumulator += deltaTime;
        if (this.fpsAccumulator >= this.fpsUpdateInterval) {
            this.fps = this.frameAccumulator / this.fpsAccumulator;
            this.frameAccumulator = 0;
            this.fpsAccumulator = 0;
        }
    }
    
    /**
     * Set the current render mode
     */
    public setRenderMode(mode: 'wave' | 'fdtd' | 'voxelspace'): void {
        this.currentRenderMode = mode;
    }
    
    /**
     * Set the current render pass name
     */
    public setRenderPass(passName: string): void {
        this.currentRenderPass = passName;
    }
    
    /**
     * Set the render resolution
     */
    public setResolution(width: number, height: number): void {
        this.renderResolution = { width, height };
    }
    
    /**
     * Set GPU information
     */
    public setGpuInfo(info: string): void {
        this.gpuInfo = info;
    }
    
    /**
     * Set a custom metric value
     */
    public setCustomMetric(key: string, value: any): void {
        this.customMetrics.set(key, value);
    }
    
    /**
     * Get a custom metric value
     */
    public getCustomMetric(key: string): any {
        return this.customMetrics.get(key);
    }
    
    /**
     * Get current frame count
     */
    public getFrameCount(): number {
        return this.frameCount;
    }
    
    /**
     * Get current delta time
     */
    public getDeltaTime(): number {
        return this.deltaTime;
    }
    
    /**
     * Get current FPS
     */
    public getFps(): number {
        return this.fps;
    }
    
    /**
     * Get current render mode
     */
    public getRenderMode(): 'wave' | 'fdtd' | 'voxelspace' {
        return this.currentRenderMode;
    }
    
    /**
     * Get current render pass
     */
    public getRenderPass(): string {
        return this.currentRenderPass;
    }
    
    /**
     * Get current render resolution
     */
    public getResolution(): { width: number, height: number } {
        return this.renderResolution;
    }
    
    /**
     * Get GPU info
     */
    public getGpuInfo(): string {
        return this.gpuInfo;
    }
}