import { ScreenBufferDescription } from "./screenBufferDescription";
import { OpticsUniformBufferDescription } from "./uniformBuffers/opticsUniformBufferDescription";
import { FDTDBufferDescription } from "./fdtdBufferDescription";
import { VoxelSpaceBufferDescription } from "./voxelSpaceBufferDescription";
import { VoxelSpaceUniformBufferDescription } from "./uniformBuffers/voxelSpaceUniformBufferDescription";

export class BufferManager {

    device: GPUDevice;
    canvas: HTMLCanvasElement;

    screenBuffers!: ScreenBufferDescription;
    fdtdBuffers!: FDTDBufferDescription;
    voxelSpaceBuffers!: VoxelSpaceBufferDescription;

    // Uniform Buffers
    opticsUniformBuffer!: OpticsUniformBufferDescription;
    voxelSpaceUniformBuffer!: VoxelSpaceUniformBufferDescription;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
        this.fdtdBuffers = new FDTDBufferDescription(this.device, this.canvas);
        this.voxelSpaceBuffers = new VoxelSpaceBufferDescription(this.device, this.canvas);
        // Uniform Buffers
        this.opticsUniformBuffer = new OpticsUniformBufferDescription(this.device, this.canvas);
        this.voxelSpaceUniformBuffer = new VoxelSpaceUniformBufferDescription(this.device);
    }
}