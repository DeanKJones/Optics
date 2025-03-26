
// Class managing buffer resources for the voxel world raymarching
export class VoxelWorldBufferDescription {
    device: GPUDevice;
    canvas: HTMLCanvasElement;
    
    // Output texture
    outputTexture!: GPUTexture;
    outputTextureView!: GPUTextureView;
    
    // Camera buffer
    cameraBuffer!: GPUBuffer;
    
    // World parameters buffer
    worldParamsBuffer!: GPUBuffer;
    
    // Instance buffer
    instanceBuffer!: GPUBuffer;
    
    // Constants
    private MAX_INSTANCES: number = 128; // Maximum number of objects to instance
    private INSTANCE_STRUCT_SIZE: number = 16 * 4; // Size in bytes of an Instance struct (16 floats)
    
    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        this.createBuffers();
    }
    
    private createBuffers(): void {
        // Create output texture for the raymarched scene
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
        
        // Create camera uniform buffer
        this.cameraBuffer = this.device.createBuffer({
            size: 32, // 8 floats (position, rotation, fov, aspect, near, far, movement_speed)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Default camera values
        const defaultCameraData = new Float32Array([
            0, 5, -15,  // position (x, y, z)
            0, 0,       // rotation (pitch, yaw)
            45 * (Math.PI / 180), // fov in radians
            this.canvas.width / this.canvas.height, // aspect ratio
            0.1, 1000,  // near, far
            5.0,        // movement speed
        ]);
        this.device.queue.writeBuffer(this.cameraBuffer, 0, defaultCameraData);
        
        // Create world parameters buffer
        this.worldParamsBuffer = this.device.createBuffer({
            size: 32, // 8 floats (time, seed, voxel_size, world_size, max_instances, event_interval, event_counter, padding)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        // Default world parameters
        const seed = Math.floor(Math.random() * 1000000);
        const defaultWorldParams = new Float32Array([
            0.0,                 // time
            seed,                // random seed
            1.0,                 // voxel size
            40.0,                // world size
            this.MAX_INSTANCES,  // max instances
            10.0,                // event interval (seconds)
            0,                   // event counter
            0.0,                 // padding
        ]);
        this.device.queue.writeBuffer(this.worldParamsBuffer, 0, defaultWorldParams);
        
        // Create instance buffer
        this.instanceBuffer = this.device.createBuffer({
            size: this.MAX_INSTANCES * this.INSTANCE_STRUCT_SIZE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        
        // Initialize instances to inactive
        const instanceData = new Float32Array(this.MAX_INSTANCES * 16);
        for (let i = 0; i < this.MAX_INSTANCES; i++) {
            const offset = i * 16;
            // position (vec3) + scale (float)
            instanceData[offset] = 0;
            instanceData[offset + 1] = 0;
            instanceData[offset + 2] = 0;
            instanceData[offset + 3] = 1.0;
            
            // color (vec4)
            instanceData[offset + 4] = 1.0;
            instanceData[offset + 5] = 1.0;
            instanceData[offset + 6] = 1.0;
            instanceData[offset + 7] = 1.0;
            
            // rotation (vec4 quaternion)
            instanceData[offset + 8] = 0;
            instanceData[offset + 9] = 0;
            instanceData[offset + 10] = 0;
            instanceData[offset + 11] = 1.0;
            
            // instance_type (u32) + active (u32) + creation_time (float) + lifetime (float)
            instanceData[offset + 12] = 0; // type
            instanceData[offset + 13] = 0; // active (0 = inactive)
            instanceData[offset + 14] = 0; // creation time
            instanceData[offset + 15] = 0; // lifetime
        }
        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
    }
    
    // Update camera position and rotation
    updateCamera(position: [number, number, number], rotation: [number, number]): void {
        const cameraData = new Float32Array(11);
        
        // Copy position
        cameraData[0] = position[0];
        cameraData[1] = position[1];
        cameraData[2] = position[2];
        
        // Copy rotation (pitch, yaw)
        cameraData[3] = rotation[0];
        cameraData[4] = rotation[1];
        
        // Don't update other parameters
        
        this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraData, 0, 5);
    }
    
    // Update world time
    updateWorldTime(time: number, eventCounter: number): void {
        const timeData = new Float32Array(2);
        timeData[0] = time;
        timeData[1] = eventCounter;
        
        this.device.queue.writeBuffer(this.worldParamsBuffer, 0, timeData, 0, 2);
    }
}