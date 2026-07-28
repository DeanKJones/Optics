import { ScreenBufferDescription } from "./screenBufferDescription";
import { OpticsUniformBufferDescription } from "./uniformBuffers/opticsUniformBufferDescription";
import { FDTDBufferDescription } from "./fdtdBufferDescription";

export class BufferManager {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    screenBuffers!: ScreenBufferDescription;
    fdtdBuffers!: FDTDBufferDescription;

    // Uniform Buffers
    opticsUniformBuffer!: OpticsUniformBufferDescription;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
        this.fdtdBuffers = new FDTDBufferDescription(this.device, this.canvas);
        this.opticsUniformBuffer = new OpticsUniformBufferDescription(this.device, this.canvas);
    }
}