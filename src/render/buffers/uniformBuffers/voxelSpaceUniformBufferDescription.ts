import { VoxelSpaceSettings } from "../../uniformDataLayouts/voxelSpaceUniformSettings";

export class VoxelSpaceUniformBufferDescription {
    device: GPUDevice;
    gpuBuffer!: GPUBuffer;
    
    constructor(device: GPUDevice) {
        this.device = device;
        
        // Create GPU buffer for VoxelSpace settings
        // 8 float values (32 bytes)
        this.gpuBuffer = device.createBuffer({
            size: 32, // 8 floats x 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Initialize with default settings
        this.updateBuffer(new VoxelSpaceSettings());
    }
    
    updateBuffer(settings: VoxelSpaceSettings): void {
        // Convert settings to Float32Array and upload to GPU
        const data = settings.toFloatArray();
        this.device.queue.writeBuffer(this.gpuBuffer, 0, data);
    }

    
}