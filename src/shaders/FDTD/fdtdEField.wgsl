// E-field update shader component for FDTD simulation
#include "fdtdHelpers.wgsl"

@compute @workgroup_size(8, 8, 1)
fn update_e_fields(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // Get dimensions and coordinates
    let textureDimensions = textureDimensions(electricField);
    let x = i32(GlobalInvocationID.x);
    let y = i32(GlobalInvocationID.y);
    
    // Bounds checking: keep one texel of margin so neighbor loads remain in-bounds.
    let maxDimensions = vec2<i32>(i32(textureDimensions.x), i32(textureDimensions.y));
    if (x <= 0 || x >= maxDimensions.x - 2 || y <= 0 || y >= maxDimensions.y - 2) {
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
    
    // Scale UV to the same simulation space used by visualization and grating geometry helpers
    normalizedUV = normalizedUV * simulation_parameters.viewportScale;

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
        // Inside slit plane material: absorb rather than reflect
        let keepFactor = getSlitPlaneKeepFactor();
        electricFieldValue = vec4<f32>(electricFieldValue.x * keepFactor, 0.0, 0.0, 0.0);
    }

    // Primary emitter: use the simulation propagation direction so the wave source is independent from the global orientation control
    let emitterBandHeightPx = f32(textureDimensions.y) * simulation_parameters.emitterBandHeight;
    var isEmitterBand = false;
    if (simulation_parameters.propagationDirection < 0.5) {
        isEmitterBand = f32(y) <= emitterBandHeightPx;
    } else if (simulation_parameters.propagationDirection < 1.5) {
        isEmitterBand = f32(y) >= (f32(textureDimensions.y) - emitterBandHeightPx);
    } else {
        isEmitterBand = f32(x) <= emitterBandHeightPx;
    }

    if (isEmitterBand) {
        let direction = getPropagationDirectionVector();
        let phase = getPlaneWavePhase(normalizedUV, simulation_parameters.wavelength, simulation_parameters.elapsedTime, direction);
        electricFieldValue = vec4<f32>(
            electricFieldValue.x + simulation_parameters.emitterAmplitude * sin(phase),
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