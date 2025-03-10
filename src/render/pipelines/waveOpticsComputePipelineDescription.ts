import { BufferManager } from "../buffers/bufferManager";
import computeKernel from "../../gpu/shaders/waveOptics/waveCompute.wgsl";

export class computePipelineDescriptor {
    device: GPUDevice;
    bufferManager: BufferManager;

    computeBindGroup_layout!: GPUBindGroupLayout;
    computeBindGroup!: GPUBindGroup;
    computePipeline!: GPUComputePipeline;

    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.initialize();
    }

    initialize = async () => {
        this.createComputeBindGroupLayout();
        await this.createComputeBindGroup();
        await this.createComputePipeline();
    }


    createComputeBindGroupLayout = () => {
        this.computeBindGroup_layout = this.device.createBindGroupLayout({
            label: "Compute Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
            ]
        });
        return this.computeBindGroup_layout;
    }


    createComputeBindGroup = async () => {
        const bindGroupLayout = this.computeBindGroup_layout;
        
        this.computeBindGroup = this.device.createBindGroup({
            label: "Compute Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.bufferManager.screenBuffers.colorBufferView
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.bufferManager.uniformBuffer.gpuBuffer,
                    }
                },
            ]
        });
    }


    createComputePipeline = async () => {
        const computeBindGroupLayout = this.computeBindGroup_layout;
        const computePipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [computeBindGroupLayout]
        });

        this.computePipeline = 
            this.device.createComputePipeline(
                {
                    label: "Diffraction Grating Simulation Pipeline",
                    layout: computePipeline_layout,
            
                    compute: {
                        module: this.device.createShaderModule({code: computeKernel,}),
                        entryPoint: 'main',
                    },
                }
            );
    }
}