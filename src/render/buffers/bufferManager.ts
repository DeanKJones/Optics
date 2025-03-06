import { ScreenBufferDescription } from "./screenBufferDescription";
import { UniformBufferDescription } from "./uniformBufferDescription";
import { UniformSettings } from "../layouts/uniformBufferSettings";
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

        // Default Settings
        let uniformSettings = new UniformSettings();
        this.writeDefaultBuffers(uniformSettings);
    }


    writeDefaultBuffers = (uniformBufferParams: UniformSettings) => {
        this.updateUniformBuffer(uniformBufferParams);
    }

    updateUniformBuffer = (uniformBufferParams: UniformSettings) => {
        this.device.queue.writeBuffer(this.uniformBuffer.gpuBuffer, 0, 
            new Float32Array([
                uniformBufferParams.deltaTime,
                uniformBufferParams.wavelength,     // Direct wavelength in nm
                uniformBufferParams.slitWidth,      // Direct slit width in mm
                uniformBufferParams.grateWidth,     // Direct grate width in mm
                uniformBufferParams.numberOfSlits,
                uniformBufferParams.screenSize,
                uniformBufferParams.redWavelength,  // Direct red wavelength in nm
                uniformBufferParams.blueWavelength  // Direct blue wavelength in nm
            ]));
    }
}