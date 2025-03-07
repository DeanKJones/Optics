import { BufferManager } from "../buffers/bufferManager";
import fdtdKernel from "../../gpu/shaders/fdtdComputeKernel.wgsl";

export class fdtdComputePipelineDescriptor {

    device: GPUDevice;
    bufferManager: BufferManager;

    fdtdBindGroup!: GPUBindGroup;
    fdtdBindGroup_layout!: GPUBindGroupLayout;
    fdtdPipelineH!: GPUComputePipeline;
    fdtdPipelineE!: GPUComputePipeline;
    fdtdVisualizationPipeline!: GPUComputePipeline;
    fdtdClearPipeline!: GPUComputePipeline;

    constructor(device: GPUDevice, bufferManager: BufferManager) {
        this.device = device;
        this.bufferManager = bufferManager;
        this.initialize();
    }

    initialize = async () => {
        this.createFDTDBindGroupLayout();
        await this.createFDTDBindGroup();
        await this.createFDTDPipelines();
    }
    
    createFDTDBindGroupLayout = () => {
        this.fdtdBindGroup_layout = this.device.createBindGroupLayout({
            label: "FDTD Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "read-write",
                        format: "r32float",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "read-write",
                        format: "r32float",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "read-write",
                        format: "r32float",
                        viewDimension: "2d"
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
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                }
            ]
        });
        return this.fdtdBindGroup_layout;
    }


    createFDTDPipelines = async () => {
        const fdtdBindGroupLayout = this.fdtdBindGroup_layout;
        const fdtdPipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [fdtdBindGroupLayout]
        });
        
        // H-field update pipeline
        this.fdtdPipelineH = this.device.createComputePipeline({
            label: "FDTD H-field Update Pipeline",
            layout: fdtdPipeline_layout,
            compute: {
                module: this.device.createShaderModule({
                    code: fdtdKernel,
                }),
                entryPoint: 'update_h_fields',
            }
        });
        
        // E-field update pipeline
        this.fdtdPipelineE = this.device.createComputePipeline({
            label: "FDTD E-field Update Pipeline",
            layout: fdtdPipeline_layout,
            compute: {
                module: this.device.createShaderModule({
                    code: fdtdKernel,
                }),
                entryPoint: 'update_e_fields',
            }
        });
        
        // Visualization pipeline
        this.fdtdVisualizationPipeline = this.device.createComputePipeline({
            label: "FDTD Visualization Pipeline",
            layout: fdtdPipeline_layout,
            compute: {
                module: this.device.createShaderModule({
                    code: fdtdKernel,
                }),
                entryPoint: 'visualize',
            }
        });
    }


    createFDTDBindGroup = async () => {
        const bindGroupLayout = this.fdtdBindGroup_layout;
        
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


    createClearTexturesPipeline() {
        const fdtdBindGroupLayout = this.fdtdBindGroup_layout;
        const clearPipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [fdtdBindGroupLayout]
        });
        
        // Create a simple compute shader to clear all textures
        const clearShaderCode = `
            @group(0) @binding(0) var electricField: texture_storage_2d<r32float, read_write>;
            @group(0) @binding(1) var magneticFieldX: texture_storage_2d<r32float, read_write>;
            @group(0) @binding(2) var magneticFieldY: texture_storage_2d<r32float, read_write>;
            @group(0) @binding(3) var visualOutput: texture_storage_2d<rgba8unorm, write>;
            
            @compute @workgroup_size(8, 8, 1)
            fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
                let textureDimensions = textureDimensions(electricField);
                let x = i32(GlobalInvocationID.x);
                let y = i32(GlobalInvocationID.y);
                
                if (x >= i32(textureDimensions.x) || y >= i32(textureDimensions.y)) {
                    return;
                }
                
                // Clear all field values to zero
                textureStore(electricField, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
                textureStore(magneticFieldX, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
                textureStore(magneticFieldY, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
                textureStore(visualOutput, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 1.0));
            }
        `;
        
        return this.device.createComputePipeline({
            label: "FDTD Clear Pipeline",
            layout: clearPipeline_layout,
            compute: {
                module: this.device.createShaderModule({
                    code: clearShaderCode,
                }),
                entryPoint: 'main',
            }
        });
    }
}