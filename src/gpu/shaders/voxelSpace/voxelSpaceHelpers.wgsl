#include "voxelSpaceCommon.wgsl"

// Helper function to rotate a 2D point around origin
fn rotate(p: vec2<f32>, angle: f32) -> vec2<f32> {
    let sinAngle = sin(angle);
    let cosAngle = cos(angle);
    return vec2<f32>(
        p.x * cosAngle - p.y * sinAngle,
        p.x * sinAngle + p.y * cosAngle
    );
}

// Sample height map with wrapping coordinates
fn sampleHeight(x: f32, y: f32) -> f32 {
    let texSize = vec2<f32>(textureDimensions(heightMap));
    let uv = vec2<f32>(
        (x / texSize.x),
        (y / texSize.y)
    );
    return textureSampleLevel(heightMap, textureSampler, uv, 0.0).r * 255.0;
}

// Sample color map with wrapping coordinates
fn sampleColor(x: f32, y: f32) -> vec4<f32> {
    let texSize = vec2<f32>(textureDimensions(colorMap));
    let uv = vec2<f32>(
        (x / texSize.x),
        (y / texSize.y)
    );
    return textureSampleLevel(colorMap, textureSampler, uv, 0.0);
}