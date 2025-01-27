
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

    render(pUniformBufferSettings: UniformSettings) {

        this.bufferManager.updateUniformBuffer(
                pUniformBufferSettings);

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.renderPipelines.computePipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineBindGroups.computeBindGroup);
        ray_trace_pass.dispatchWorkgroups(
            this.canvas.width * 4,      // 2x the resolution for supersampling
            this.canvas.height * 4, 1
        );
        ray_trace_pass.end();

        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
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
        this.device.queue.onSubmittedWorkDone()
    }
}