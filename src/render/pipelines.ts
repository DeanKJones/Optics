import computeKernel from "../gpu/shaders/computeKernel.wgsl"
import screenShader from "../gpu/shaders/screenShader.wgsl"
import fdtdKernel from "../gpu/shaders/fdtdKernel.wgsl";

import { BindGroupLayouts } from "./pipelineLayouts";

export class Pipelines {

    device: GPUDevice;
    bindGroupLayouts!: BindGroupLayouts;
    computePipeline!: GPUComputePipeline;
    screenPipeline!: GPURenderPipeline;
    fdtdPipelineH!: GPUComputePipeline;
    fdtdPipelineE!: GPUComputePipeline;
    fdtdVisualizationPipeline!: GPUComputePipeline;
    fdtdClearPipeline!: GPUComputePipeline;


    constructor(device: GPUDevice) {
        this.device = device;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);

        this.initialize();
    }

    async initialize() {
        await this.createScreenPipeline();
        await this.createComputePipeline();
        await this.createFdtdPipelines();
        this.fdtdClearPipeline = this.createClearTexturesPipeline();
    }

    createComputePipeline = async () => {
        const computeBindGroupLayout = this.bindGroupLayouts.createComputeBindGroupLayout();
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

    createScreenPipeline = async () => {
        const screenBindGroupLayout = this.bindGroupLayouts.createScreenBindGroupLayout();
        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [screenBindGroupLayout]
        });

        this.screenPipeline = this.device.createRenderPipeline({
            label: "Screen Pipeline",
            layout: screen_pipeline_layout,
            
            vertex: {
                module: this.device.createShaderModule({
                                    code: screenShader, 
                                }),
                entryPoint: 'vert_main',
            },

            fragment: {
                module: this.device.createShaderModule({
                                    code: screenShader,
                                }),
                entryPoint: 'frag_main',
                targets: [
                {
                    format: "bgra8unorm"
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });
    }

    createFdtdPipelines = async () => {
        const fdtdBindGroupLayout = this.bindGroupLayouts.createFdtdBindGroupLayout();
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

    createClearTexturesPipeline() {
        const fdtdBindGroupLayout = this.bindGroupLayouts.createFdtdBindGroupLayout();
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