// src/gpu/shaders/voxelVertex.wgsl
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec3<f32>,
}

struct Uniforms {
    transform: mat4x4<f32>,
    voxelSize: f32,
    voxelDensity: f32,
    padding1: f32,
    padding2: f32,
    viewProjection: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Define a cube using 36 vertices (6 faces * 2 triangles * 3 vertices)
    var positions = array<vec3<f32>, 8>(
        vec3<f32>(-0.5, -0.5, -0.5),
        vec3<f32>( 0.5, -0.5, -0.5),
        vec3<f32>(-0.5,  0.5, -0.5),
        vec3<f32>( 0.5,  0.5, -0.5),
        vec3<f32>(-0.5, -0.5,  0.5),
        vec3<f32>( 0.5, -0.5,  0.5),
        vec3<f32>(-0.5,  0.5,  0.5),
        vec3<f32>( 0.5,  0.5,  0.5)
    );
    
    var indices = array<u32, 36>(
        // front face
        0, 2, 1, 1, 2, 3,
        // back face
        4, 5, 6, 5, 7, 6,
        // left face
        0, 4, 2, 2, 4, 6,
        // right face
        1, 3, 5, 3, 7, 5,
        // bottom face
        0, 1, 4, 1, 5, 4,
        // top face
        2, 6, 3, 3, 6, 7
    );
    
    let vertexPosition = positions[indices[vertexIndex]];
    
    var output: VertexOutput;
    output.position = uniforms.viewProjection * uniforms.transform * vec4<f32>(vertexPosition, 1.0);
    output.texCoord = vertexPosition + vec3<f32>(0.5);
    
    return output;
}