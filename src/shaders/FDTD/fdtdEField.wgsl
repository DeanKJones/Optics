// E-field update shader component for FDTD simulation
#include "fdtdHelpers.wgsl"

@compute @workgroup_size(8, 8, 1)
fn update_e_fields(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // Get dimensions and coordinates
    let textureDimensions = textureDimensions(electricField);
    let x = i32(GlobalInvocationID.x);
    let y = i32(GlobalInvocationID.y);
    
    // Bounds checking
    let maxDimensions = vec2<i32>(i32(textureDimensions.x), i32(textureDimensions.y));
    if (x < 0 || x >= maxDimensions.x - 1 || y < 0 || y >= maxDimensions.y - 1) {
        return;
    }
    
    // Calculate normalized position in simulation space
    let normalizedPosition = vec2<f32>(
        (f32(x) / f32(textureDimensions.x)) * 2.0 - 1.0,
        (f32(y) / f32(textureDimensions.y)) * 2.0 - 1.0
    ) * simulation_parameters.viewportScale;

    let fragCoord = vec2<f32>(f32(x), f32(y));
    let resolution = vec2<f32>(f32(textureDimensions.x), f32(textureDimensions.y));
    var normalizedUV = (2.0 * fragCoord - resolution) / resolution.y;
    
    // Get magnetic field values at this point and adjacent points
    let magneticXHere = textureLoad(magneticFieldX, vec2<i32>(x, y));
    let magneticXBelow = textureLoad(magneticFieldX, vec2<i32>(x, y - 1));
    let magneticYHere = textureLoad(magneticFieldY, vec2<i32>(x, y));
    let magneticYLeft = textureLoad(magneticFieldY, vec2<i32>(x - 1, y));
    
    // Stability factor for simulation
    let stabilityFactor = 0.5;
    
    // Check if this point is in the diffraction grating material
    let isInGratingMaterial = isInDiffractionGrating(normalizedUV);
    
    // Get current electric field value
    var electricFieldValue = textureLoad(electricField, vec2<i32>(x, y));
    
    // Update electric field based on Maxwell's equations
    if (!isInGratingMaterial) {
        // In free space, electric field changes based on curl of magnetic field
        let magneticFieldCurlZ = (magneticYHere.x - magneticYLeft.x) - (magneticXHere.x - magneticXBelow.x);
        electricFieldValue = vec4<f32>(electricFieldValue.x + stabilityFactor * magneticFieldCurlZ, 0.0, 0.0, 0.0);
    } else {
        // Inside grating material (perfect conductor), electric field is zero
        electricFieldValue = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    
    // Add primary wave source - a plane wave
    if (abs(normalizedUV.y - LIGHT_SOURCE_HEIGHT * simulation_parameters.viewportScale) < 0.02 / simulation_parameters.viewportScale) {
        let phase = getWavelengthPhase(normalizedUV, simulation_parameters.wavelength, simulation_parameters.elapsedTime);
        let sourceAmplitude = 4.0;
        electricFieldValue = vec4<f32>(
            electricFieldValue.x + sourceAmplitude * sin(phase),
            0.0, 0.0, 0.0
        );
    }
    
    // Add secondary sources at slit edges (Huygens' principle)
    if (isInsideSlit(normalizedUV)) {
        let amplitude = 15.0;
        let slitCenter = vec2<f32>(normalizedUV.x, DIFFRACTION_GRATING_HEIGHT);
        let phase = getWavelengthPhase(normalizedUV - slitCenter, 
                                      simulation_parameters.wavelength, 
                                      simulation_parameters.elapsedTime);
        electricFieldValue = vec4<f32>(
            (electricFieldValue.x + amplitude * sin(phase)) * 0.5,
            0.0, 0.0, 0.0
        );
    }
    
    // Apply absorbing boundary conditions at edges of simulation
    let absorptionFactor = calculateAbsorptionFactor(normalizedPosition);
    if (absorptionFactor < 1.0) {
        electricFieldValue = vec4<f32>(
            electricFieldValue.x * absorptionFactor,
            0.0, 0.0, 0.0);
    }
    
    // Store the final electric field value
    textureStore(electricField, vec2<i32>(x, y), electricFieldValue);
}