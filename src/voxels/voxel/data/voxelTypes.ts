// src/voxel/data/voxelTypes.ts
export interface VoxelData {
    density: number;     // 0-1, where 0 is empty
    materialId: number;  // Index into material lookup
    emissive: number;    // How much light the voxel emits
    reserved: number;    // For future use
}

export class Voxel3DTexture {
    device: GPUDevice;
    texture: GPUTexture;
    textureView: GPUTextureView;
    size: number;
    
    constructor(device: GPUDevice, size: number) {
        this.device = device;
        this.size = size;
        
        // Create a 3D texture to store voxel data
        this.texture = device.createTexture({
            size: { width: size, height: size, depthOrArrayLayers: size },
            format: "rgba8unorm",  // Each channel stores different voxel properties
            usage: GPUTextureUsage.COPY_DST | 
                   GPUTextureUsage.STORAGE_BINDING | 
                   GPUTextureUsage.TEXTURE_BINDING
        });
        
        this.textureView = this.texture.createView();
    }
    
    // Method to update voxel data
    updateVoxelData(voxelData: Uint8Array) {
        // Each voxel has 4 channels (RGBA)
        const bytesPerRow = this.size * 4;
        const rowsPerImage = this.size;
        
        this.device.queue.writeTexture(
            { texture: this.texture },
            voxelData,
            { bytesPerRow, rowsPerImage },
            { width: this.size, height: this.size, depthOrArrayLayers: this.size }
        );
    }
    
    destroy() {
        this.texture.destroy();
    }
}