import { ScreenBufferDescription } from "./screenBufferDescription";
import { UniformBufferDescription } from "./uniformBufferDescription";
import { FDTDBufferDescription } from "./fdtdBufferDescription";

export class BufferManager {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    screenBuffers!: ScreenBufferDescription;
    uniformBuffer!: UniformBufferDescription;
    fdtdBuffers!: FDTDBufferDescription;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
        this.uniformBuffer = new UniformBufferDescription(this.device, this.canvas);
        this.fdtdBuffers = new FDTDBufferDescription(this.device, this.canvas);
    }
}