// H-field update shader component for FDTD simulation
#include "fdtdHelpers.wgsl"

@compute @workgroup_size(8, 8, 1)
fn update_h_fields(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // Get the pixel coordinates we're processing
    let textureDimensions = textureDimensions(electricField);
    let x = i32(GlobalInvocationID.x);
    let y = i32(GlobalInvocationID.y);
    
    // Convert dimensions to i32 for comparison
    let maxDimensions = vec2<i32>(i32(textureDimensions.x), i32(textureDimensions.y));
    
    // Bounds checking - skip if outside valid range
    if (x < 0 || x >= maxDimensions.x - 1 || y < 0 || y >= maxDimensions.y - 1) {
        return;
    }
    
    // Get electric field values at this point and adjacent points
    // This allows us to calculate spatial derivatives (curl of E field)
    let electricFieldHere = textureLoad(electricField, vec2<i32>(x, y));
    let electricFieldRight = textureLoad(electricField, vec2<i32>(x + 1, y));
    let electricFieldAbove = textureLoad(electricField, vec2<i32>(x, y + 1));
    
    // Stability factor (prevents simulation from exploding)
    // For 2D simulations, this should be <= 1/sqrt(2) for stability
    let stabilityFactor = 0.5;
    
    // Update magnetic field values based on curl of electric field
    // These equations come from Faraday's Law: ∂B/∂t = -∇×E
    var magneticXValue = textureLoad(magneticFieldX, vec2<i32>(x, y)).x - 
                      stabilityFactor * (electricFieldAbove.x - electricFieldHere.x);
    var magneticYValue = textureLoad(magneticFieldY, vec2<i32>(x, y)).x + 
                      stabilityFactor * (electricFieldRight.x - electricFieldHere.x);
    
    // Calculate normalized position in simulation space
    let normalizedPosition = vec2<f32>(
        (f32(x) / f32(textureDimensions.x)) * 2.0 - 1.0,
        (f32(y) / f32(textureDimensions.y)) * 2.0 - 1.0
    ) * simulation_parameters.viewportScale;
    
    // Apply absorbing boundary conditions to prevent reflections at edges
    let absorptionFactor = calculateAbsorptionFactor(normalizedPosition);
    if (absorptionFactor < 1.0) {
        // Gradually dampen waves at boundaries
        magneticXValue = magneticXValue * absorptionFactor;
        magneticYValue = magneticYValue * absorptionFactor;
    }
    
    // Store the updated magnetic field values
    textureStore(magneticFieldX, vec2<i32>(x, y), vec4<f32>(magneticXValue, 0.0, 0.0, 0.0));
    textureStore(magneticFieldY, vec2<i32>(x, y), vec4<f32>(magneticYValue, 0.0, 0.0, 0.0));
}