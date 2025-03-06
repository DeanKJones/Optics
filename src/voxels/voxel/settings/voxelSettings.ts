// src/voxel/settings/voxelSettings.ts
export class VoxelSettings {
    // Voxel properties
    voxelSize: number = 0.05;  // Size of each voxel in world space
    voxelDensity: number = 32; // Number of voxels per meter
    
    // Camera settings
    cameraPosition: [number, number, number] = [2.0, 2.0, 2.0];
    cameraTarget: [number, number, number] = [0.0, 0.0, 0.0];
    
    // Rendering settings
    ambientLight: number = 0.2;
    directionalLightDir: [number, number, number] = [1.0, 1.0, 1.0];
    directionalLightColor: [number, number, number] = [1.0, 0.9, 0.8];
    
    // Performance settings
    useOctree: boolean = true;
}