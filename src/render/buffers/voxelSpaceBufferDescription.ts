export class VoxelSpaceBufferDescription {
    device: GPUDevice;
    canvas: HTMLCanvasElement;
    
    // Input textures
    heightMapTexture!: GPUTexture;
    heightMapView!: GPUTextureView;
    colorMapTexture!: GPUTexture;
    colorMapView!: GPUTextureView;
    
    // Output texture
    outputTexture!: GPUTexture;
    outputTextureView!: GPUTextureView;
    
    // Samplers
    sampler!: GPUSampler;
    
    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        this.createTextures();
        this.createSamplers();
    }
    
    private createTextures(): void {
        // Create output texture
        const outputSize = {
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        this.outputTexture = this.device.createTexture({
            size: outputSize,
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
        });
        this.outputTextureView = this.outputTexture.createView();
        
        // Create placeholder textures for height and color maps (will be loaded later)
        const mapSize = {width: 1024, height: 1024}; // Default size for maps
        
        this.heightMapTexture = this.device.createTexture({
            size: mapSize,
            format: "r8unorm",  // Single channel for height
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        });
        this.heightMapView = this.heightMapTexture.createView();
        
        this.colorMapTexture = this.device.createTexture({
            size: mapSize,
            format: "rgba8unorm", // RGBA for color
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        });
        this.colorMapView = this.colorMapTexture.createView();
    }
    
    private createSamplers(): void {
        this.sampler = this.device.createSampler({
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        });
    }
    
    async loadTextures(heightMapUrl: string, colorMapUrl: string): Promise<void> {
        // Load height map
        const heightMapImg = await this.loadImage(heightMapUrl);
        await this.uploadImageToTexture(heightMapImg, this.heightMapTexture, {format: 'r8unorm'});
        
        // Load color map
        const colorMapImg = await this.loadImage(colorMapUrl);
        await this.uploadImageToTexture(colorMapImg, this.colorMapTexture, {format: 'rgba8unorm'});
    }
    
    private async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    async loadVoxelSpaceTextures(heightMapUrl: string, colorMapUrl: string): Promise<void> {
        await this.loadTextures(heightMapUrl, colorMapUrl);
    }
    
    private async uploadImageToTexture(
        image: HTMLImageElement, 
        texture: GPUTexture, 
        options: {format: string}
    ): Promise<void> {
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = image.width;
        imageCanvas.height = image.height;
        
        const ctx = imageCanvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        
        // For r8unorm format, we need to extract just the R channel
        if (options.format === 'r8unorm') {
            const rChannelData = new Uint8Array(image.width * image.height);
            for (let i = 0; i < imageData.data.length/4; i++) {
                // Use red channel as height data
                rChannelData[i] = imageData.data[i * 4];
            }
            
            this.device.queue.writeTexture(
                { texture },
                rChannelData,
                { bytesPerRow: image.width },
                { width: image.width, height: image.height }
            );
        } else {
            // For RGBA textures, use the data directly
            this.device.queue.writeTexture(
                { texture },
                imageData.data,
                { bytesPerRow: image.width * 4 },
                { width: image.width, height: image.height }
            );
        }
    }
}