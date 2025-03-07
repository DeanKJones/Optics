// src/gpu/shaders/voxelFragment.wgsl
@group(0) @binding(1) var voxelTexture: texture_3d<f32>;
@group(0) @binding(2) var voxelSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec3<f32>,
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
    // Sample the 3D voxel texture
    let voxelData = textureSample(voxelTexture, voxelSampler, input.texCoord);
    
    // If density is zero, discard the fragment (empty voxel)
    if (voxelData.r < 0.01) {
        discard;
    }
    
    // Generate color based on material ID (stored in G channel)
    let materialColor = hsv2rgb(voxelData.g * 360.0, 0.8, 0.9);
    
    // Apply simple lighting based on the surface normal
    // This is simplified - ideally, you'd have proper normal calculation
    // based on voxel neighbors or surface reconstruction
    let normal = normalize(input.texCoord - vec3<f32>(0.5));
    let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
    let diffuse = max(dot(normal, lightDir), 0.0);
    
    // Add ambient and emissive components
    let ambient = 0.2;
    let emissive = voxelData.b;
    
    let finalColor = materialColor * (ambient + diffuse) + vec3<f32>(emissive);
    
    return vec4<f32>(finalColor, 1.0);
}

// Helper function to convert HSV to RGB
fn hsv2rgb(h: f32, s: f32, v: f32) -> vec3<f32> {
    let c = v * s;
    let h1 = h / 60.0;
    let x = c * (1.0 - abs(h1 % 2.0 - 1.0));
    let m = v - c;
    
    var rgb: vec3<f32>;
    
    if (h1 < 1.0) {
        rgb = vec3<f32>(c, x, 0.0);
    } else if (h1 < 2.0) {
        rgb = vec3<f32>(x, c, 0.0);
    } else if (h1 < 3.0) {
        rgb = vec3<f32>(0.0, c, x);
    } else if (h1 < 4.0) {
        rgb = vec3<f32>(0.0, x, c);
    } else if (h1 < 5.0) {
        rgb = vec3<f32>(x, 0.0, c);
    } else {
        rgb = vec3<f32>(c, 0.0, x);
    }
    
    return rgb + vec3<f32>(m);
}