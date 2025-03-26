import { BufferManager } from "../buffers/bufferManager";
import { computePipelineDescriptor } from "./waveOpticsComputePipelineDescription";
import { screenPipelineDescriptor } from "./screenPipelineDescription";
import { fdtdComputePipelineDescriptor } from "./fdtdComputePipelineDescription";
import { VoxelSpacePipelineDescription } from "./voxelSpaceComputePipelineDescription";
import { VoxelWorldPipelineDescription } from "./voxelWorldPipelineDescription";

export class PipelineManager {

    device: GPUDevice;
    
    fdtdPipeline!: fdtdComputePipelineDescriptor;
    computePipeline!: computePipelineDescriptor;
    screenPipeline!: screenPipelineDescriptor;
    voxelSpacePipeline!: VoxelSpacePipelineDescription;
    voxelWorldPipeline!: VoxelWorldPipelineDescription;

    constructor(device: GPUDevice, bufferManager: BufferManager){
        this.device = device;

        this.fdtdPipeline = new fdtdComputePipelineDescriptor(this.device, bufferManager);
        this.computePipeline = new computePipelineDescriptor(this.device, bufferManager);
        this.screenPipeline = new screenPipelineDescriptor(this.device, bufferManager);
        this.voxelSpacePipeline = new VoxelSpacePipelineDescription(this.device, bufferManager);
        this.voxelWorldPipeline = new VoxelWorldPipelineDescription(this.device, bufferManager);
    }
}