import { ScreenBufferDescription } from "./screenBufferDescription";
import { UniformBufferDescription } from "./uniformBufferDescription";
import { UniformBufferStruct } from "../layouts/uniformBufferStruct";

export class BufferManager {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    screenBuffers!: ScreenBufferDescription;
    uniformBuffer!: UniformBufferDescription;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
        this.uniformBuffer = new UniformBufferDescription(this.device, this.canvas);

        this.writeDefaultBuffers();
    }


    writeDefaultBuffers = () => {
        this.updateUniformBuffer({    // Default values
            deltaTime: 0.0,
            frequency: 20.0,
        });
    }

    updateUniformBuffer = (uniformBufferParams: UniformBufferStruct) => {
            this.device.queue.writeBuffer(this.uniformBuffer.gpuBuffer, 0, 
                    new Float32Array([uniformBufferParams.deltaTime,
                                     uniformBufferParams.frequency,]));
        }
}