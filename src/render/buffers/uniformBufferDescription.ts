export class UniformBufferDescription {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    gpuBuffer!: GPUBuffer;
 

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        this.gpuBuffer = device.createBuffer({
            size: 24, // 6 floats x 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
          });
    }
}