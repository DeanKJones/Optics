// src/voxel/render/voxelRenderer.ts
import { VoxelSceneManager } from "../scene/voxelSceneManager";
import { VoxelSettings } from "../settings/voxelSettings";
import voxelVertexShader from "../../../gpu/shaders/voxelVertex.wgsl";
import voxelFragmentShader from "../../../gpu/shaders/voxelFragment.wgsl";
import { mat4 } from 'gl-matrix'; // Add this import

export class VoxelRenderer {
    canvas: HTMLCanvasElement;
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;
    
    voxelRenderPipeline!: GPURenderPipeline;
    cameraUniformBuffer!: GPUBuffer;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    
    async Initialize() {
        await this.setupDevice();
        await this.createPipelines();
    }
    
    async setupDevice() {
        try {
            const adapter = await navigator.gpu?.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to get GPU adapter.");
            }
            this.adapter = adapter;
            
            const device = await this.adapter.requestDevice();
            this.device = device;
            
            const context = this.canvas.getContext("webgpu");
            if (!context) {
                throw new Error("Failed to get WebGPU context.");
            }
            this.context = context;
            
            this.format = "bgra8unorm";
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: "opaque"
            });
            
            // Create camera uniform buffer
            this.cameraUniformBuffer = this.device.createBuffer({
                size: 16 * 4, // mat4 (view-projection matrix)
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            
        } catch (error) {
            console.error("Error setting up WebGPU:", error);
        }
    }
    
    async createPipelines() {
        // Create bindgroup layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float", viewDimension: "3d" }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: "filtering" }
                }
            ]
        });
        
        // Create pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        
        // Create render pipeline
        this.voxelRenderPipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: this.device.createShaderModule({
                    code: voxelVertexShader
                }),
                entryPoint: "main"
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: voxelFragmentShader
                }),
                entryPoint: "main",
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "back"
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus"
            }
        });
    }
    
    updateCamera(settings: VoxelSettings) {
        const viewMatrix = mat4.create();
        const projMatrix = mat4.create();
        const viewProjMatrix = mat4.create();
        
        // Set up view matrix (camera position)
        mat4.lookAt(
            viewMatrix,
            settings.cameraPosition as [number, number, number], // eye position
            settings.cameraTarget as [number, number, number],   // target position
            [0, 1, 0]                                           // up vector
        );
        
        // Set up projection matrix (perspective)
        mat4.perspective(
            projMatrix,
            Math.PI / 4,                                        // 45-degree FOV
            this.canvas.width / this.canvas.height,             // aspect ratio
            0.1,                                                // near plane
            100.0                                               // far plane
        );
        
        // Combine into view-projection matrix
        mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
        
        // Explicitly create a Float32Array view
        const viewProjData = new Float32Array(viewProjMatrix);

        // Write to GPU buffer
        this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, viewProjData);
    }
    
    render(sceneManager: VoxelSceneManager, settings: VoxelSettings) {
        this.updateCamera(settings);
        
        // Get the next texture to render to and create command encoder
        const textureView = this.context.getCurrentTexture().createView();
        const commandEncoder = this.device.createCommandEncoder();
        
        // Create depth texture for this frame
        const depthTexture = this.device.createTexture({
            size: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        
        // Begin render pass
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });
        
        renderPass.setPipeline(this.voxelRenderPipeline);
        
        // Render each voxel object
        for (const object of sceneManager.objects) {
            // Create a bindgroup for this object
            const bindGroup = this.device.createBindGroup({
                layout: this.voxelRenderPipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: object.uniformBuffer }
                    },
                    {
                        binding: 1,
                        resource: object.voxelTexture.textureView
                    },
                    {
                        binding: 2,
                        resource: this.device.createSampler({
                            magFilter: "linear",
                            minFilter: "linear"
                        })
                    }
                ]
            });
            
            renderPass.setBindGroup(0, bindGroup);
            renderPass.draw(36); // Draw cube (6 faces * 2 triangles * 3 vertices)
        }
        
        renderPass.end();
        depthTexture.destroy();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }
}