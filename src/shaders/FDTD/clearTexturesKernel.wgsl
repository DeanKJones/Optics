// Clear shader for FDTD simulation textures
// Resets all electromagnetic field components to zero

#include "fdtdCommon.wgsl"

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let textureDimensions = textureDimensions(electricField);
    let x = i32(GlobalInvocationID.x);
    let y = i32(GlobalInvocationID.y);
    
    if (x >= i32(textureDimensions.x) || y >= i32(textureDimensions.y)) {
        return;
    }
    
    // Clear all field values to zero
    textureStore(electricField, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
    textureStore(magneticFieldX, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
    textureStore(magneticFieldY, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 0.0));
    textureStore(visualOutput, vec2<i32>(x, y), vec4<f32>(0.0, 0.0, 0.0, 1.0));
}