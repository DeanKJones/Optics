import { OpticsUniformSettings } from "../../uniformDataLayouts/opticsUniformSettings";

export class OpticsUniformBufferDescription {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    gpuBuffer!: GPUBuffer;
 

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;
        
        this.gpuBuffer = device.createBuffer({
            size: 24, // 6 floats x 4 bytes (including red/blue frequency ratios)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
          });
        
        this.writeDefaultBuffers(new OpticsUniformSettings());
    }

    writeDefaultBuffers = (uniformBufferParams: OpticsUniformSettings) => {
        this.updateBuffer(uniformBufferParams);
    }

    updateBuffer = (uniformBufferParams: OpticsUniformSettings) => {
        this.device.queue.writeBuffer(this.gpuBuffer, 0, 
            new Float32Array([
                uniformBufferParams.deltaTime,
                uniformBufferParams.wavelength,     // Direct wavelength in nm
                uniformBufferParams.slitWidth,      // Direct slit width in mm
                uniformBufferParams.grateWidth,     // Direct grate width in mm
                uniformBufferParams.numberOfSlits,
                uniformBufferParams.screenSize,
            ]));
    }
}