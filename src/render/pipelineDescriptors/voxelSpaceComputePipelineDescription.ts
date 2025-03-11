import { BufferManager } from "../buffers/bufferManager";
import { VoxelSpaceUniformBufferDescription } from "../buffers/uniformBuffers/voxelSpaceUniformBufferDescription";
import voxelSpaceCompute from "../../gpu/shaders/voxelSpace/voxelSpaceCompute.wgsl";

export class VoxelSpacePipelineDescription {
    device: GPUDevice;
    bufferManager: BufferManager;
    voxelSpaceUniformBuffer: VoxelSpaceUniformBufferDescription;
    
    voxelSpaceBindGroupLayout!: GPUBindGroupLayout;
    voxelSpaceBindGroup!: GPUBindGroup;
    voxelSpacePipeline!: GPUComputePipeline;
    
    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.voxelSpaceUniformBuffer = bufferManager.voxelSpaceUniformBuffer;
        this.initialize();
    }
    
    initialize = async () => {
        this.createVoxelSpaceBindGroupLayout();
        await this.createVoxelSpaceBindGroup();
        await this.createVoxelSpacePipeline();
    }
    
    createVoxelSpaceBindGroupLayout = () => {
        this.voxelSpaceBindGroupLayout = this.device.createBindGroupLayout({
            label: "VoxelSpace Bind Group Layout",
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
                    sampler: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        sampleType: "float"
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        sampleType: "float"
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                }
            ]
        });
        return this.voxelSpaceBindGroupLayout;
    }
    
    createVoxelSpaceBindGroup = async () => {
        const bindGroupLayout = this.voxelSpaceBindGroupLayout;
        
        this.voxelSpaceBindGroup = this.device.createBindGroup({
            label: "VoxelSpace Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.voxelSpaceUniformBuffer.gpuBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.bufferManager.voxelSpaceBuffers.sampler
                },
                {
                    binding: 2,
                    resource: this.bufferManager.voxelSpaceBuffers.heightMapView
                },
                {
                    binding: 3,
                    resource: this.bufferManager.voxelSpaceBuffers.colorMapView
                },
                {
                    binding: 4,
                    resource: this.bufferManager.voxelSpaceBuffers.outputTextureView
                }
            ]
        });
    }
    
    createVoxelSpacePipeline = async () => {
        const voxelSpaceBindGroupLayout = this.voxelSpaceBindGroupLayout;
        const voxelSpacePipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [voxelSpaceBindGroupLayout]
        });
        
        this.voxelSpacePipeline = this.device.createComputePipeline({
            label: "VoxelSpace Rendering Pipeline",
            layout: voxelSpacePipelineLayout,
            compute: {
                module: this.device.createShaderModule({
                    code: voxelSpaceCompute
                }),
                entryPoint: 'main'
            }
        });
    }
}