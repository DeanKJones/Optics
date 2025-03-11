import { BufferManager } from "../buffers/bufferManager";

import clearTexturesKernel from "../../gpu/shaders/FDTD/clearTexturesKernel.wgsl";
import fdtdEField from "../../gpu/shaders/FDTD/fdtdEField.wgsl";
import fdtdHField from "../../gpu/shaders/FDTD/fdtdHField.wgsl";
import fdtdVisualize from "../../gpu/shaders/FDTD/fdtdVisualize.wgsl";

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
                    code: fdtdHField,
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
                    code: fdtdEField,
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
                    code: fdtdVisualize,
                }),
                entryPoint: 'visualize',
            }
        });

        // Clear textures pipeline - now part of createFDTDPipelines
        this.fdtdClearPipeline = this.device.createComputePipeline({
            label: "FDTD Clear Pipeline",
            layout: fdtdPipeline_layout,
            compute: {
                module: this.device.createShaderModule({
                    code: clearTexturesKernel,
                }),
                entryPoint: 'main',
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
                        buffer: this.bufferManager.opticsUniformBuffer.gpuBuffer,
                    }
                }
            ]
        });
    }
}