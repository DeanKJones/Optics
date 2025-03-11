// Common bindings and structures for VoxelSpace rendering

// Textures
@group(0) @binding(0) var<uniform> settings: VoxelSpaceSettings;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var heightMap: texture_2d<f32>;
@group(0) @binding(3) var colorMap: texture_2d<f32>;
@group(0) @binding(4) var outputTexture: texture_storage_2d<rgba8unorm, write>;

// Settings structure matching the uniform buffer
struct VoxelSpaceSettings {
    positionX: f32,
    positionY: f32,
    height: f32,
    angle: f32,
    horizon: f32,
    scale: f32,
    distance: f32,
    padding: f32,
}