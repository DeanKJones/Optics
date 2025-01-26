

export class BindGroupLayouts {

    device: GPUDevice;

    computeBindGroup_layout!: GPUBindGroupLayout;
    screenBindGroup_layout!: GPUBindGroupLayout;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    createComputeBindGroupLayout = () => {
        this.computeBindGroup_layout = this.device.createBindGroupLayout({
            label: "Compute Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
            ]
        });
        return this.computeBindGroup_layout;
    }

    createScreenBindGroupLayout = () => {
        this.screenBindGroup_layout = this.device.createBindGroupLayout({
            label: "Screen Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
            ]
        });
        return this.screenBindGroup_layout;
    }
}