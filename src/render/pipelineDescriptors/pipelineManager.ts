import { BufferManager } from "../buffers/bufferManager";
import { screenPipelineDescriptor } from "./screenPipelineDescription";
import { fdtdComputePipelineDescriptor } from "./fdtdComputePipelineDescription";

export class PipelineManager {

    device: GPUDevice;
    
    fdtdPipeline!: fdtdComputePipelineDescriptor;
    screenPipeline!: screenPipelineDescriptor;

    constructor(device: GPUDevice, bufferManager: BufferManager){
        this.device = device;

        this.fdtdPipeline = new fdtdComputePipelineDescriptor(this.device, bufferManager);
        this.screenPipeline = new screenPipelineDescriptor(this.device, bufferManager);
    }
}