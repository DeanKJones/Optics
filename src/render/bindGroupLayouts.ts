import { BindGroupLayouts } from "./pipelineLayouts";
import { BufferManager } from "./buffers/bufferManager";


export class PipelineBindGroupLayouts {
    device: GPUDevice;
    bufferManager: BufferManager;

    bindGroupLayouts!: BindGroupLayouts;

    computeBindGroup!: GPUBindGroup;
    screenBindGroup!: GPUBindGroup;
    fdtdBindGroup!: GPUBindGroup;

    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);

        this.initialize();
    }

    async initialize() {
        await this.CreateComputeBindGroupPipeline();
        await this.CreateScreenBindGroupPipeline();
        await this.CreateFdtdBindGroupPipeline();
    }

    CreateComputeBindGroupPipeline = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createComputeBindGroupLayout();
        
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

    CreateScreenBindGroupPipeline = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createScreenBindGroupLayout();

        this.screenBindGroup = this.device.createBindGroup({
            label: "Screen Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource:  this.bufferManager.screenBuffers.sampler
                },
                {
                    binding: 1,
                    resource: this.bufferManager.screenBuffers.colorBufferView
                }
            ]
        });
    }

    CreateFdtdBindGroupPipeline = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createFdtdBindGroupLayout();
        
        this.fdtdBindGroup = this.device.createBindGroup({
            label: "FDTD Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.bufferManager.fdtdBuffers.ezBufferView
                },
                {
                    binding: 1,
                    resource: this.bufferManager.fdtdBuffers.hxBufferView
                },
                {
                    binding: 2,
                    resource: this.bufferManager.fdtdBuffers.hyBufferView
                },
                {
                    binding: 3,
                    resource: this.bufferManager.fdtdBuffers.fieldVisualizationView
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.bufferManager.uniformBuffer.gpuBuffer,
                    }
                }
            ]
        });
    }
}