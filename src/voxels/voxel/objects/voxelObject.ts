// src/voxel/objects/voxelObject.ts
import { Voxel3DTexture } from "../data/voxelTypes";

export class VoxelObject {
    device: GPUDevice;
    position: [number, number, number] = [0, 0, 0];
    rotation: [number, number, number] = [0, 0, 0];
    scale: [number, number, number] = [1, 1, 1];
    
    voxelTexture: Voxel3DTexture;
    voxelSize: number;
    voxelDensity: number;
    
    uniformBuffer: GPUBuffer;
    
    constructor(device: GPUDevice, voxelSize: number, voxelDensity: number) {
        this.device = device;
        this.voxelSize = voxelSize;
        this.voxelDensity = voxelDensity;
        
        // Create a 3D texture for voxel data
        this.voxelTexture = new Voxel3DTexture(device, voxelDensity);
        
        // Create uniform buffer for transform and other per-object data
        this.uniformBuffer = device.createBuffer({
            size: 16 * 4 + 8 * 4, // mat4 + vec4 + vec4 (transform + params)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.updateUniformBuffer();
    }
    
    updateUniformBuffer() {
        // Create transformation matrix and other data
        // This is simplified - you'd use proper matrix math here
        const uniformData = new Float32Array(24);
        // Fill transformation matrix...
        
        // Fill in object params
        uniformData[16] = this.voxelSize;
        uniformData[17] = this.voxelDensity;
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }
    
    setPosition(x: number, y: number, z: number) {
        this.position = [x, y, z];
        this.updateUniformBuffer();
    }
    
    setRotation(x: number, y: number, z: number) {
        this.rotation = [x, y, z];
        this.updateUniformBuffer();
    }
    
    setScale(x: number, y: number, z: number) {
        this.scale = [x, y, z];
        this.updateUniformBuffer();
    }
}