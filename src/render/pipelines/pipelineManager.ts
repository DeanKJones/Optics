import { BufferManager } from "../buffers/bufferManager";
import { computePipelineDescriptor } from "./computePipelineDescription";
import { screenPipelineDescriptor } from "./screenPipelineDescription";



export class pipelineManager {

    device: GPUDevice;

    computePipeline!: computePipelineDescriptor;
    screenPipeline!: screenPipelineDescriptor;

    constructor(device: GPUDevice, bufferManager: BufferManager){
        this.device = device;

        this.computePipeline = new computePipelineDescriptor(this.device, bufferManager);
        this.screenPipeline = new screenPipelineDescriptor(this.device, bufferManager);
    }
}