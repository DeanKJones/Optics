import { Pipelines } from "./pipelines";
import { BufferManager } from "./buffers/bufferManager";
import { PipelineBindGroupLayouts } from "./bindGroupLayouts";
import { UniformSettings } from "./layouts/uniformBufferSettings";

export class Renderer {

    canvas: HTMLCanvasElement;

    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    renderPipelines!: Pipelines;
    pipelineBindGroups!: PipelineBindGroupLayouts;
    bufferManager!: BufferManager;

    // Add flag to switch between visualization modes
    useFdtdSimulation: boolean = false;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

   async Initialize() {

        await this.setupDevice();
        this.bufferManager = new BufferManager(this.device, this.canvas);

        this.renderPipelines = new Pipelines(this.device);
        this.pipelineBindGroups = new PipelineBindGroupLayouts(this.device, this.bufferManager);
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

            this.device.lost.then((info) => {
                console.error("WebGPU device was lost:", info);
                // Attempt to recreate the device
                this.setupDevice();
            });
            
            //context: similar to vulkan instance (or OpenGL context)
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

    // Modify render method to choose between simulations
    render(pUniformBufferSettings: UniformSettings) {
        // Make sure bufferManager is initialized
        if (!this.bufferManager) {
            console.error("Buffer manager not initialized");
            return;
        }
        
        this.bufferManager.updateUniformBuffer(pUniformBufferSettings);
        
        if (this.useFdtdSimulation) {
            this.renderFdtdSimulation();
        } else {
            this.renderWaveOptics();
        }
    }
    
    // Move existing render code to this method
    renderWaveOptics() {
        // Original code from render method
        const commandEncoder = this.device.createCommandEncoder();
        
        const ray_trace_pass = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.renderPipelines.computePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineBindGroups.computeBindGroup);
        ray_trace_pass.dispatchWorkgroups(
            this.canvas.width * 8,
            this.canvas.height * 8, 1
        );
        ray_trace_pass.end();
        
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        
        renderpass.setPipeline(this.renderPipelines.screenPipeline);
        renderpass.setBindGroup(0, this.pipelineBindGroups.screenBindGroup);
        renderpass.draw(6, 1, 0, 0);
        
        renderpass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
        this.device.queue.onSubmittedWorkDone();
    }
    
    // New FDTD simulation render method
    renderFdtdSimulation() {
        const commandEncoder = this.device.createCommandEncoder();
        
        // FDTD computation involves multiple passes
        const fdtd_compute_pass = commandEncoder.beginComputePass();
        
        // 1. Update H fields
        fdtd_compute_pass.setPipeline(this.renderPipelines.fdtdPipelineH);
        fdtd_compute_pass.setBindGroup(0, this.pipelineBindGroups.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(this.canvas.width * 4 / 8),
            Math.ceil(this.canvas.height * 4 / 8), 
            1
        );
        
        // 2. Update E fields
        fdtd_compute_pass.setPipeline(this.renderPipelines.fdtdPipelineE);
        fdtd_compute_pass.setBindGroup(0, this.pipelineBindGroups.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(this.canvas.width * 4 / 8),
            Math.ceil(this.canvas.height * 4 / 8), 
            1
        );
        
        // 3. Visualize the fields
        fdtd_compute_pass.setPipeline(this.renderPipelines.fdtdVisualizationPipeline);
        fdtd_compute_pass.setBindGroup(0, this.pipelineBindGroups.fdtdBindGroup);
        fdtd_compute_pass.dispatchWorkgroups(
            Math.ceil(this.canvas.width * 4 / 8),
            Math.ceil(this.canvas.height * 4 / 8), 
            1
        );
        
        fdtd_compute_pass.end();
        
        // Now render the visualization to the screen
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        
        // Create a special bind group for FDTD visualization
        const fdtdScreenBindGroup = this.device.createBindGroup({
            label: "FDTD Screen Bind Group",
            layout: this.renderPipelines.screenPipeline.getBindGroupLayout(0),
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
        
        // Use the screen pipeline with the FDTD visualization
        renderpass.setPipeline(this.renderPipelines.screenPipeline);
        renderpass.setBindGroup(0, fdtdScreenBindGroup); // Use the FDTD-specific bind group
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
        computePass.setPipeline(this.renderPipelines.fdtdClearPipeline);
        computePass.setBindGroup(0, this.pipelineBindGroups.fdtdBindGroup);
        
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
}