// Visualization shader component for FDTD simulation
#include "fdtdHelpers.wgsl"

@compute @workgroup_size(8, 8, 1)
fn visualize(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // Get coordinates
    let textureDimensions = textureDimensions(electricField);
    let x = i32(GlobalInvocationID.x);
    let y = i32(GlobalInvocationID.y);
    let resolution = vec2<f32>(f32(textureDimensions.x), f32(textureDimensions.y));
    
    // Bounds checking
    let maxDimensions = vec2<i32>(i32(textureDimensions.x), i32(textureDimensions.y));
    if (x < 0 || x >= maxDimensions.x - 1 || y < 0 || y >= maxDimensions.y - 1) {
        return;
    }
    
    // Calculate normalized uv position
    let fragCoord = vec2<f32>(f32(x), f32(y));
    var normalizedUV = (2.0 * fragCoord - resolution) / resolution.y;
    normalizedUV.x = simulation_parameters.viewportScale * f32(normalizedUV.x);
    normalizedUV.y = simulation_parameters.viewportScale * f32(normalizedUV.y);
    
    // Get electric field value with its RGB components
    let electricFieldValues = textureLoad(electricField, vec2<i32>(x, y));
    let isInGratingMaterial = isInDiffractionGrating(normalizedUV);
    
    var pixelColor = vec4<f32>(0.0, 0.0, 0.0, 1.0); // Black background
    
    if (isInGratingMaterial) {
        // White for grating material
        pixelColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    } else {
        let electricField = electricFieldValues.x;
        var fieldValue = electricField;
        let fieldMagnitude = abs(fieldValue);
        let positiveColor = vec3<f32>(
            simulation_parameters.positiveColorR,
            simulation_parameters.positiveColorG,
            simulation_parameters.positiveColorB
        );
        let negativeColor = vec3<f32>(
            simulation_parameters.negativeColorR,
            simulation_parameters.negativeColorG,
            simulation_parameters.negativeColorB
        );
        
        // Positive/negative field use configurable visualization colors
        if (fieldMagnitude > 0.01) { 
            let intensity = clamp(fieldMagnitude / 0.7, 0.0, 1.0);

            if (fieldValue > 0.0) {
                pixelColor = vec4<f32>(positiveColor * intensity, 1.0);
            } else {
                pixelColor = vec4<f32>(negativeColor * intensity, 1.0); 
            }
        }
    }

    let debugMode = 0;
    if (debugMode > 0) {
        let emitterBandEdgeY = simulation_parameters.viewportScale - (2.0 * simulation_parameters.emitterBandHeight * simulation_parameters.viewportScale);

        // Show grating in red, slits in blue
        if (isInDiffractionGrating(normalizedUV)) {
            pixelColor = vec4<f32>(0.8, 0.0, 0.0, 1.0);
        } else if (normalizedUV.y >= emitterBandEdgeY) {
            // Get the actual electric field value at this point
            let fieldValue = electricFieldValues.x;
            // Use actual field value to modulate the color intensity
            pixelColor = vec4<f32>(fieldValue, 0.0, 0.0, 1.0);
        }
    }
    
    // Output the final color
    textureStore(visualOutput, vec2<i32>(x, y), pixelColor);
}