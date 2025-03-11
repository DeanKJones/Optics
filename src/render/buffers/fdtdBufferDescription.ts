// src/render/buffers/fdtdBufferDescription.ts
export class FDTDBufferDescription {
    device: GPUDevice;
    canvas: HTMLCanvasElement;
    
    // Field components (for 2D TE mode simulation)
    ezBuffer!: GPUTexture;
    ezBufferView!: GPUTextureView;
    hxBuffer!: GPUTexture;
    hxBufferView!: GPUTextureView;
    hyBuffer!: GPUTexture;
    hyBufferView!: GPUTextureView;
    
    // For visualization
    fieldVisualizationBuffer!: GPUTexture;
    fieldVisualizationView!: GPUTextureView;
    sampler!: GPUSampler;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        // Create texture buffers for EM field components with 32-bit float precision
        const size = { 
            width: this.canvas.width * 2,
            height: this.canvas.height * 2
        };
        
        this.ezBuffer = this.createFieldBuffer(size, "r32float");
        this.ezBufferView = this.ezBuffer.createView();
        
        this.hxBuffer = this.createFieldBuffer(size, "r32float");
        this.hxBufferView = this.hxBuffer.createView();
        
        this.hyBuffer = this.createFieldBuffer(size, "r32float");
        this.hyBufferView = this.hyBuffer.createView();
        
        // Visualization buffer (RGBA for color)
        this.fieldVisualizationBuffer = this.createFieldBuffer(size, "rgba8unorm");
        this.fieldVisualizationView = this.fieldVisualizationBuffer.createView();
        
        // Create sampler for visualization
        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        };
        this.sampler = this.device.createSampler(samplerDescriptor);
    }
    
    private createFieldBuffer(size: {width: number, height: number}, format: GPUTextureFormat): GPUTexture {
        return this.device.createTexture({
            size: size,
            format: format,
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
        });
    }
}