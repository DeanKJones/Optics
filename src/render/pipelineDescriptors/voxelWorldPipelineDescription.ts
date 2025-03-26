import { BufferManager } from "../buffers/bufferManager";
import voxelWorldCompute from "../../shaders/voxelWorld/voxelWorldCompute.wgsl";
import voxelWorldEvents from "../../shaders/voxelWorld/voxelWorldEvents.wgsl";

export class VoxelWorldPipelineDescription {
    device: GPUDevice;
    bufferManager: BufferManager;
    
    voxelWorldBindGroupLayout!: GPUBindGroupLayout;
    voxelWorldBindGroup!: GPUBindGroup;
    voxelWorldPipeline!: GPUComputePipeline;
    voxelWorldEventsPipeline!: GPUComputePipeline;
    
    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.initialize();
    }
    
    initialize = async () => {
        this.createVoxelWorldBindGroupLayout();
        await this.createVoxelWorldBindGroup();
        await this.createVoxelWorldPipeline();
    }
    
    createVoxelWorldBindGroupLayout = () => {
        this.voxelWorldBindGroupLayout = this.device.createBindGroupLayout({
            label: "VoxelWorld Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                }
            ]
        });
        return this.voxelWorldBindGroupLayout;
    }
    
    createVoxelWorldBindGroup = async () => {
        const bindGroupLayout = this.voxelWorldBindGroupLayout;
        
        this.voxelWorldBindGroup = this.device.createBindGroup({
            label: "VoxelWorld Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.bufferManager.voxelWorldBuffers.cameraBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.bufferManager.voxelWorldBuffers.worldParamsBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.bufferManager.voxelWorldBuffers.instanceBuffer
                    }
                },
                {
                    binding: 3,
                    resource: this.bufferManager.voxelWorldBuffers.outputTextureView
                }
            ]
        });
    }
    
    createVoxelWorldPipeline = async () => {
        const voxelWorldBindGroupLayout = this.voxelWorldBindGroupLayout;
        const voxelWorldPipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [voxelWorldBindGroupLayout]
        });
        
        // Main raymarching pipeline
        this.voxelWorldPipeline = this.device.createComputePipeline({
            label: "VoxelWorld Raymarching Pipeline",
            layout: voxelWorldPipelineLayout,
            compute: {
                module: this.device.createShaderModule({
                    code: voxelWorldCompute
                }),
                entryPoint: 'main'
            }
        });
        
        // Events pipeline for timed events and animations
        this.voxelWorldEventsPipeline = this.device.createComputePipeline({
            label: "VoxelWorld Events Pipeline",
            layout: voxelWorldPipelineLayout,
            compute: {
                module: this.device.createShaderModule({
                    code: voxelWorldEvents
                }),
                entryPoint: 'main'
            }
        });
    }
}