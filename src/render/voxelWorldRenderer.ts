import { VoxelWorldBufferDescription } from "./buffers/voxelWorldBufferDescription";
import { VoxelWorldPipelineDescription } from "./pipelineDescriptors/voxelWorldPipelineDescription";
import { VoxelWorldCameraController } from "../worldSettings/voxelWorldCameraController";
import { RenderContext } from "./renderContext";

/**
 * Manages rendering of the procedural voxel world
 */
export class VoxelWorldRenderer {
    private device: GPUDevice;
    private context: GPUCanvasContext;
    private canvas: HTMLCanvasElement;
    
    // Resources
    private buffers: VoxelWorldBufferDescription;
    private pipeline: VoxelWorldPipelineDescription;
    private cameraController: VoxelWorldCameraController;
    
    // Timing
    private lastFrameTime: number = performance.now();
    private totalRuntime: number = 0;
    private eventCounter: number = 0;
    private eventInterval: number = 10; // Seconds between events
    
    // Render context for UI
    private renderContext: RenderContext;
    
    constructor(
        device: GPUDevice, 
        context: GPUCanvasContext, 
        canvas: HTMLCanvasElement,
        buffers: VoxelWorldBufferDescription,
        pipeline: VoxelWorldPipelineDescription,
        renderContext: RenderContext
    ) {
        this.device = device;
        this.context = context;
        this.canvas = canvas;
        this.buffers = buffers;
        this.pipeline = pipeline;
        this.renderContext = renderContext;
        
        // Create camera controller
        this.cameraController = new VoxelWorldCameraController(this.buffers);
        
        // Set initial position for a good view
        this.cameraController.setPosition(0, 10, -20);
        this.cameraController.setRotation(0.3, 0); // Look slightly down
    }
    
    /**
     * Update world state and render a frame
     * @param deltaTime Time since last frame in seconds
     */
    public render(_deltaTime: number): void {
        // Update timing
        const currentTime = performance.now();
        const frameDeltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Update total runtime
        this.totalRuntime += frameDeltaTime;
        
        // Update camera
        this.cameraController.update(frameDeltaTime);
        
        // Update world time
        this.buffers.updateWorldTime(this.totalRuntime, this.eventCounter);
        
        // Check if it's time for a new event
        if (Math.floor(this.totalRuntime / this.eventInterval) > this.eventCounter) {
            this.eventCounter = Math.floor(this.totalRuntime / this.eventInterval);
            this.renderContext.setCustomMetric('worldEvent', `Event #${this.eventCounter}`);
        }
        
        // Update render context with camera info
        const position = this.cameraController.getPosition();
        this.renderContext.setCustomMetric('cameraPos', `X:${position[0].toFixed(1)} Y:${position[1].toFixed(1)} Z:${position[2].toFixed(1)}`);
        
        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();
        
        // First run the events shader to process any timed events
        const eventsPass = commandEncoder.beginComputePass();
        eventsPass.setPipeline(this.pipeline.voxelWorldEventsPipeline);
        eventsPass.setBindGroup(0, this.pipeline.voxelWorldBindGroup);
        eventsPass.dispatchWorkgroups(1, 1, 1); // Single workgroup for events
        eventsPass.end();
        
        // Then run the main raymarching shader
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.pipeline.voxelWorldPipeline);
        computePass.setBindGroup(0, this.pipeline.voxelWorldBindGroup);
        
        // Calculate workgroup counts to cover the entire screen
        // Using 8x8 workgroup size as defined in the shader
        const workgroupCountX = Math.ceil(this.canvas.width / 8);
        const workgroupCountY = Math.ceil(this.canvas.height / 8);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY, 1);
        computePass.end();
        
        // Copy the raymarched output to the canvas
        commandEncoder.copyTextureToTexture(
            { texture: this.buffers.outputTexture },
            { texture: this.context.getCurrentTexture() },
            [this.canvas.width, this.canvas.height]
        );
        
        // Submit commands
        this.device.queue.submit([commandEncoder.finish()]);
    }
    
    /**
     * Reset the world and all event counters
     */
    public reset(): void {
        this.lastFrameTime = performance.now();
        this.totalRuntime = 0;
        this.eventCounter = 0;
        
        // Update world time
        this.buffers.updateWorldTime(this.totalRuntime, this.eventCounter);
        
        // Reset camera position
        this.cameraController.setPosition(0, 10, -20);
        this.cameraController.setRotation(0.3, 0);
    }
}