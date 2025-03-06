// src/voxel/scene/voxelSceneManager.ts
import { VoxelObject } from "../objects/voxelObject";
import { VoxelRenderer } from "../render/voxelRenderer";

export class VoxelSceneManager {
    renderer: VoxelRenderer;
    objects: VoxelObject[] = [];
    
    constructor(renderer: VoxelRenderer) {
        this.renderer = renderer;
    }
    
    addObject(object: VoxelObject) {
        this.objects.push(object);
    }
    
    removeObject(object: VoxelObject) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }
    
    update(deltaTime: number) {
        // Update all objects
        for (const object of this.objects) {
            // Apply any animations or physics here
            // For now, just rotate the object slightly
            object.rotation[1] += deltaTime * 0.5;
            object.updateUniformBuffer();
        }
    }
    
    updateVoxelSize(size: number) {
        for (const object of this.objects) {
            object.voxelSize = size;
            object.updateUniformBuffer();
        }
    }
    
    updateVoxelDensity(density: number) {
        // This would require recreating the voxel data textures
        console.log("Updating voxel density would require recreating voxel data");

        // For now, just update the voxel density setting
        for (const object of this.objects) {
            object.voxelDensity = density;
            object.updateUniformBuffer();
        }
    }
    
    // Create a demo cube with some missing voxels
    createDemoCube(voxelSize: number, voxelDensity: number): VoxelObject {
        const device = this.renderer.device;
        const object = new VoxelObject(device, voxelSize, voxelDensity);
        
        // Create voxel data for a cube with some missing voxels
        const voxelData = new Uint8Array(voxelDensity * voxelDensity * voxelDensity * 4);
        
        for (let z = 0; z < voxelDensity; z++) {
            for (let y = 0; y < voxelDensity; y++) {
                for (let x = 0; x < voxelDensity; x++) {
                    const index = (z * voxelDensity * voxelDensity + y * voxelDensity + x) * 4;
                    
                    // Create a cube with some missing voxels in patterns
                    const isBorder = x === 0 || x === voxelDensity - 1 || 
                                     y === 0 || y === voxelDensity - 1 || 
                                     z === 0 || z === voxelDensity - 1;
                    
                    // Create a checkerboard pattern on each face
                    const isCheckerboardVoid = (x + y + z) % 2 === 0 && isBorder;
                    
                    // Create some random holes inside
                    const isRandom = Math.random() > 0.8 && !isBorder;
                    
                    if (!isCheckerboardVoid && !isRandom) {
                        // Solid voxel
                        voxelData[index] = 255;      // density (full)
                        voxelData[index + 1] = 128;  // material ID
                        voxelData[index + 2] = 0;    // emissive (none)
                        voxelData[index + 3] = 255;  // reserved (full)
                    } else {
                        // Empty voxel
                        voxelData[index] = 0;        // density (empty)
                        voxelData[index + 1] = 0;    // material ID
                        voxelData[index + 2] = 0;    // emissive
                        voxelData[index + 3] = 0;    // reserved
                    }
                }
            }
        }
        
        object.voxelTexture.updateVoxelData(voxelData);
        return object;
    }
}