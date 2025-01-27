import { ScreenBufferDescription } from "./screenBufferDescription";
import { UniformBufferDescription } from "./uniformBufferDescription";
import { UniformSettings } from "../layouts/uniformBufferSettings";

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

        // Default Settings
        let uniformSettings = new UniformSettings();
        this.writeDefaultBuffers(uniformSettings);
    }


    writeDefaultBuffers = (uniformBufferParams: UniformSettings) => {
        this.updateUniformBuffer(uniformBufferParams);
    }

    updateUniformBuffer = (uniformBufferParams: UniformSettings) => {
            this.device.queue.writeBuffer(this.uniformBuffer.gpuBuffer, 0, 
                    new Float32Array([uniformBufferParams.deltaTime,
                                      uniformBufferParams.frequency,
                                      uniformBufferParams.slitWidth,
                                      uniformBufferParams.grateWidth,
                                      uniformBufferParams.numberOfSlits]));
        }
}