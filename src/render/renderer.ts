import { PipelineManager } from "./pipelineDescriptors/pipelineManager";
import { BufferManager } from "./buffers/bufferManager";
import { SettingsManager } from "../worldSettings/settingsManager";

// Remdering
import { RenderContext } from "./renderContext";

export class Renderer {
    canvas: HTMLCanvasElement;

    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    bufferManager!: BufferManager;
    pipelineManager!: PipelineManager;
    settingsManager: SettingsManager;

    initialized: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, private renderContext?: RenderContext) {
        this.canvas = canvas;
        this.settingsManager = SettingsManager.getInstance();
    }

    async Initialize() {
        await this.setupDevice();
        this.bufferManager = new BufferManager(this.device, this.canvas);
        this.pipelineManager = new PipelineManager(this.device, this.bufferManager);
        
        this.initialized = true;
    }

    async setupDevice() {
        try {
            const adapter = await navigator.gpu?.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to get GPU adapter.");
            }
            this.adapter = adapter;

            const device = await this.adapter.requestDevice();
            if (!device) {
                throw new Error("Failed to get GPU device.");
            }
            this.device = device;

            this.device.addEventListener("uncapturederror", (event) => {
                const gpuEvent = event as GPUUncapturedErrorEvent;
                console.error("WebGPU uncaptured error:", gpuEvent.error);
            });

            this.device.lost.then((info) => {
                console.error("WebGPU device was lost:", info);
                // Attempt to recreate the device
                this.setupDevice();
            });
            
            const context = this.canvas.getContext("webgpu");
            if (!context) {
                throw new Error("Failed to get WebGPU context.");
            }
            this.context = context;
            console.log("WebGPU context obtained:", this.context);
            console.log("Configuring context...");

            this.format = "bgra8unorm";
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: "opaque"
            });

            // Add cleanup on unload
            const cleanup = () => {
                console.log("Cleaning up WebGPU resources...");
                if (this.device) {
                    this.device.destroy();
                }
            };
            window.addEventListener('unload', cleanup);
            window.addEventListener('beforeunload', cleanup);

        } catch (error) {
            console.error("Error during WebGPU setup:", error);
        }
    }

    render(deltaTime: number) {
        if (!this.initialized) {
            console.warn("Renderer not initialized yet");
            return;
        }
        
        // Update all settings
        this.settingsManager.update(deltaTime);
        
        // Update uniform buffers with the latest settings
        this.bufferManager.opticsUniformBuffer.updateBuffer(this.settingsManager.optics);
        this.renderFdtdSimulation();
    }
    
    renderFdtdSimulation() {
        if (!this.pipelineManager?.fdtdPipeline?.fdtdPipelineH ||
            !this.pipelineManager?.fdtdPipeline?.fdtdPipelineE ||
            !this.pipelineManager?.fdtdPipeline?.fdtdVisualizationPipeline ||
            !this.pipelineManager?.screenPipeline?.screenPipeline) {
            return;
        }

        this.renderContext?.setRenderPass('FDTD Simulation');
        const commandEncoder = this.device.createCommandEncoder();
        
        // FDTD computation involves multiple passes
        const fdtd_compute_pass = commandEncoder.beginComputePass();
        
        const textureWidth = this.bufferManager.fdtdBuffers.ezBuffer.width;
        const textureHeight = this.bufferManager.fdtdBuffers.ezBuffer.height;

        // 1. Update H fields
        fdtd_compute_pass.setPipeline(this.pipelineManager.fdtdPipeline.fdtdPipelineH);
        fdtd_compute_pass.setBindGroup(0, this.pipelineManager.fdtdPipeline.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(textureWidth / 8),
            Math.ceil(textureHeight / 8),
            1
        );
        
        // 2. Update E fields
        fdtd_compute_pass.setPipeline(this.pipelineManager.fdtdPipeline.fdtdPipelineE);
        fdtd_compute_pass.setBindGroup(0, this.pipelineManager.fdtdPipeline.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(textureWidth / 8),
            Math.ceil(textureHeight / 8),
            1
        );
        
        // 3. Visualize the fields
        fdtd_compute_pass.setPipeline(this.pipelineManager.fdtdPipeline.fdtdVisualizationPipeline);
        fdtd_compute_pass.setBindGroup(0, this.pipelineManager.fdtdPipeline.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(textureWidth / 8),
            Math.ceil(textureHeight / 8),
            1
        );
        
        fdtd_compute_pass.end();
        
        // Create a special bind group for FDTD visualization
        const fdtdScreenBindGroup = this.device.createBindGroup({
            label: "FDTD Screen Bind Group",
            layout: this.pipelineManager.screenPipeline.screenPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: this.bufferManager.fdtdBuffers.sampler
                },
                {
                    binding: 1,
                    resource: this.bufferManager.fdtdBuffers.fieldVisualizationView
                }
            ]
        });
        
        this.renderToScreen(commandEncoder, fdtdScreenBindGroup);
    }
    
    // Helper method to render to screen
    private renderToScreen(commandEncoder: GPUCommandEncoder, bindGroup: GPUBindGroup) {
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        
        renderpass.setPipeline(this.pipelineManager.screenPipeline.screenPipeline);
        renderpass.setBindGroup(0, bindGroup);
        renderpass.draw(6, 1, 0, 0);
        renderpass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }

    resetFdtdSimulation() {
        // Create a command encoder for this operation
        const commandEncoder = this.device.createCommandEncoder();
        
        // Start a compute pass
        const computePass = commandEncoder.beginComputePass();
        
        // Set the clear pipeline
        computePass.setPipeline(this.pipelineManager.fdtdPipeline.fdtdClearPipeline);
        computePass.setBindGroup(0, this.pipelineManager.fdtdPipeline.fdtdBindGroup);
        
        // Calculate workgroup counts to cover the entire texture
        const texWidth = this.bufferManager.fdtdBuffers.ezBuffer.width;
        const texHeight = this.bufferManager.fdtdBuffers.ezBuffer.height;
        
        computePass.dispatchWorkgroups(
            Math.ceil(texWidth / 8),
            Math.ceil(texHeight / 8),
            1
        );
        
        // End the compute pass
        computePass.end();
        
        // Submit the command buffer
        this.device.queue.submit([commandEncoder.finish()]);
        console.log("FDTD simulation reset successfully");
    }

    setRenderMode(mode: 'fdtd'): void {
        this.settingsManager.renderMode = mode;
    }
    
    getRenderMode(): 'fdtd' {
        return this.settingsManager.renderMode;
    }
}