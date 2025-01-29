
import computeKernel from "../gpu/shaders/computeKernel.wgsl"
import screenShader from "../gpu/shaders/screenShader.wgsl"

import { BindGroupLayouts } from "./pipelineLayouts";

export class Pipelines {

    device: GPUDevice;
    bindGroupLayouts!: BindGroupLayouts;
    computePipeline!: GPUComputePipeline;
    screenPipeline!: GPURenderPipeline;


    constructor(device: GPUDevice) {
        this.device = device;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);

        this.initialize();
    }

    async initialize() {
        await this.createScreenPipeline();
        await this.createComputePipeline();
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
}