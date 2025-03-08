export class UniformBufferDescription {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    gpuBuffer!: GPUBuffer;
 

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        this.gpuBuffer = device.createBuffer({
            size: 32, // 8 floats x 4 bytes (including red/blue frequency ratios)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
          });
    }
}