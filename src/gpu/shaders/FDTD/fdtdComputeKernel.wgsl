// Wave Optics Simulation using Finite-Difference Time-Domain (FDTD) method
// This shader simulates electromagnetic wave propagation through space

// Original field textures
@group(0) @binding(0) var electricField: texture_storage_2d<r32float, read_write>;
@group(0) @binding(1) var magneticFieldX: texture_storage_2d<r32float, read_write>;
@group(0) @binding(2) var magneticFieldY: texture_storage_2d<r32float, read_write>;
@group(0) @binding(3) var visualOutput: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(4) var<uniform> simulation_parameters: SimulationParameters;

// Parameters controlling the simulation behavior
struct SimulationParameters {
    elapsedTime: f32,              // Time elapsed in simulation
    wavelength: f32,               // In nanometers (green)
    slitWidth: f32,                // Width of each slit in mm
    grateWidth: f32,               // Total width of the diffraction grating in mm
    numberOfSlits: f32,            // Number of slits in the diffraction grating
    viewportScale: f32,            // Scale factor for the simulation viewport
    redWavelength: f32,            // Red wavelength in nm
    blueWavelength: f32,           // Blue wavelength in nm
}

// Physical constants
const SPEED_OF_LIGHT: f32 = 1.0;                // Normalized light speed
const FREE_SPACE_IMPEDANCE: f32 = 377.0;        // Impedance of free space (ohms)
const DIFFRACTION_GRATING_HEIGHT: f32 = -0.95;  // Y-position of the diffraction grating
const LIGHT_SOURCE_HEIGHT: f32 = -0.965;        // Y-position of the primary light source
const ABSORBING_BORDER_WIDTH: f32 = 0.15;       // Width of absorbing boundary (fraction of screen)
const ABSORPTION_STRENGTH: f32 = 0.99;          // Absorption coefficient (0-1)

// Helper function to convert wavelength to wave frequency for simulation
fn getWavelengthPhase(position: vec2<f32>, wavelength: f32, time: f32) -> f32 {
    // Calculate frequency based on wavelength (shorter wavelength = higher frequency)
    // c = wavelength * frequency, so frequency = c/wavelength
    let baseSpeed = 15.0; // Base propagation speed in simulation
    
    // Frequency should be inversely proportional to wavelength
    let frequency = baseSpeed / (wavelength * 0.01);
    
    // Spatial component (wavelength determines the spatial frequency)
    let spatialFreq = 6.28 / (wavelength * 0.01); // 2π
    
    // For wave propagation, combine spatial and temporal components
    // The temporal component is now scaled by frequency (proper physics relationship)
    return spatialFreq * length(position) + frequency * time;
}

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
    // Maps from pixel coordinates to physical coordinates (-1 to 1)
    let normalizedPosition = vec2<f32>(
        (f32(x) / f32(textureDimensions.x)) * 2.0 - 1.0,
        (f32(y) / f32(textureDimensions.y)) * 2.0 - 1.0
    ) * simulation_parameters.viewportScale;

    let fragCoord = vec2<f32>(f32(x), f32(y));
    let resolution = vec2<f32>(f32(textureDimensions.x), f32(textureDimensions.y));
    var normalizedUV = (2.0 * fragCoord - resolution) / resolution.y;
    
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


fn isInsideSlit(normalizedPosition: vec2<f32>) -> bool {
    let gratingHeight = DIFFRACTION_GRATING_HEIGHT * simulation_parameters.viewportScale;
    
    // Check if we're near the grating's y-position
    if (abs(normalizedPosition.y - gratingHeight) > 0.05) {
        return false; // Not at grating height
    }
    
    // We can leverage the existing grating function - if it's not in grating material,
    // and it's at the grating height, then it must be inside a slit
    return !isInDiffractionGrating(normalizedPosition);
}


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
    // This converts pixel coordinates to physical coordinates (-1 to 1)
    let normalizedPosition = vec2<f32>(
        (f32(x) / f32(textureDimensions.x)) * 2.0 - 1.0,
        (f32(y) / f32(textureDimensions.y)) * 2.0 - 1.0
    ) * simulation_parameters.viewportScale;

    let fragCoord = vec2<f32>(f32(x), f32(y));
    let resolution = vec2<f32>(f32(textureDimensions.x), f32(textureDimensions.y));
    var normalizedUV = (2.0 * fragCoord - resolution) / resolution.y;
    
    // Get magnetic field values at this point and adjacent points
    // This allows us to calculate spatial derivatives (curl of H field)
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
    // These equations come from Ampere's Law: ∂E/∂t = (1/ε)∇×H
    if (!isInGratingMaterial) {
        // In free space, electric field changes based on curl of magnetic field
        let magneticFieldCurlZ = (magneticYHere.x - magneticYLeft.x) - (magneticXHere.x - magneticXBelow.x);
        electricFieldValue = vec4<f32>(electricFieldValue.x + stabilityFactor * magneticFieldCurlZ, 0.0, 0.0, 0.0);
    } else {
        // Inside grating material (perfect conductor), electric field is zero
        electricFieldValue = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    
    // Add primary wave source - a plane wave
    // This creates the initial electromagnetic disturbance
    if (abs(normalizedUV.y - LIGHT_SOURCE_HEIGHT * simulation_parameters.viewportScale) < 0.02 / simulation_parameters.viewportScale) {
        // Phase
        let phase = getWavelengthPhase(normalizedUV, simulation_parameters.wavelength, simulation_parameters.elapsedTime);
        
        // Increase amplitude and ADD to existing field (instead of overwrite)
        // This creates a continuous wave source with stronger amplitude
        let sourceAmplitude = 4.0;  // Increased amplitude
        electricFieldValue = vec4<f32>(
            electricFieldValue.x + sourceAmplitude * sin(phase),  // Add to existing field
            0.0,
            0.0,
            0.0
        );
    }
    
    // Add secondary sources at slit edges (Huygens' principle)
    // This creates the diffraction effect as waves emanate from each slit
    if (isInsideSlit(normalizedUV)) {
        // Create strong oscillations directly at the slits
        let amplitude = 15.0;  // Increased amplitude for better visibility
      
        // Get slit center for proper wave emission calculation
        let slitCenter = vec2<f32>(normalizedUV.x, DIFFRACTION_GRATING_HEIGHT);
      
        // Calculate phase based on distance from slit center (for circular waves)
        // This creates a point source at each slit position
        let phase = getWavelengthPhase(normalizedUV - slitCenter, 
                                      simulation_parameters.wavelength, 
                                      simulation_parameters.elapsedTime);
      
        // ADD to existing field values instead of overwriting
        // This allows waves to propagate through slits more effectively
        electricFieldValue = vec4<f32>(
            (electricFieldValue.x + amplitude * sin(phase)) * 0.5,
            0.0,
            0.0, 
            0.0
        );
    }
    
    // Apply absorbing boundary conditions at edges of simulation
    let absorptionFactor = calculateAbsorptionFactor(normalizedPosition);
    if (absorptionFactor < 1.0) {
        // Gradually dampen waves at boundaries to prevent reflections
        electricFieldValue = vec4<f32>(
            electricFieldValue.x * absorptionFactor,
            0.0, 0.0, 0.0);
    }
    
    // Store the final electric field value
    textureStore(electricField, vec2<i32>(x, y), electricFieldValue);
}


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
        // Scale for better visibility
        var fieldValue = electricField;
        let fieldMagnitude = abs(fieldValue);
        
        // Positive field = blue, negative field = red
        if (fieldMagnitude > 0.001) { 

            let scaledMagnitude = clamp(fieldValue, -0.7, 0.7);

            if (fieldValue > 0.0) {
                pixelColor = vec4<f32>(0.0, 0.0, scaledMagnitude, 1.0);
            } else {
                pixelColor = vec4<f32>(-scaledMagnitude, 0.0, 0.0, 1.0); 
            }
        }
    }

    let debugMode = 0;
    if (debugMode > 0) {
        // Show grating in red, slits in blue
        if (isInDiffractionGrating(normalizedUV)) {
            pixelColor = vec4<f32>(0.8, 0.0, 0.0, 1.0);
        } else if (abs(normalizedUV.y - LIGHT_SOURCE_HEIGHT * simulation_parameters.viewportScale) < 0.02 / simulation_parameters.viewportScale) {
            // Get the actual electric field value at this point
            let fieldValue = electricFieldValues.x;

            // Use actual field value to modulate the color intensity
            pixelColor = vec4<f32>(fieldValue, 0.0, 0.0, 1.0);
        }
    }
    
    // Output the final color
    textureStore(visualOutput, vec2<i32>(x, y), pixelColor);
}

// Function to determine if a point is within the diffraction grating material
// Returns true for points in the grating material, false for points in slits
fn isInDiffractionGrating(normalizedPosition: vec2<f32>) -> bool {
    // Scale the grating height by the viewport scale
    let gratingHeight = DIFFRACTION_GRATING_HEIGHT * simulation_parameters.viewportScale;
    
    // First check if we're near the grating's y-position
    // The grating has a certain thickness
    if (abs(normalizedPosition.y - gratingHeight) > 0.05) {
        return false; // Not at grating height
    }
    
    // Multiple slits - check each slit position
    for (var i = 0; i < i32(simulation_parameters.numberOfSlits); i = i + 1) {

        // Calculate position of each slit
        var slitPosition: f32 = 0.0;
        if (simulation_parameters.numberOfSlits <= 1.0) {
            slitPosition = 0.5;  // Center single slit like compute shader
        } else {
            slitPosition = f32(i) / (simulation_parameters.numberOfSlits - 1.0);
        }

        let slitCenterX = -simulation_parameters.grateWidth + 
                          (2.0 * simulation_parameters.grateWidth * slitPosition);
        
        // Check if point is within this slit
        if (abs(normalizedPosition.x - slitCenterX) < (simulation_parameters.slitWidth * 0.5)) {
            return false; // In a slit (not in grating material)
        }
    }
    // At grating height but not in any slit = in grating material
    return true;
}

// Function to calculate absorption factor at simulation boundaries
// This prevents waves from reflecting at the edges of the simulation
fn calculateAbsorptionFactor(normalizedPosition: vec2<f32>) -> f32 {
    // Calculate distance to each boundary (normalized 0-1)
    // 1.0 means we're at or beyond the absorbing region
    // 0.0 means we're at the very edge of the simulation
    let distanceToLeftEdge = (normalizedPosition.x + simulation_parameters.viewportScale) / 
                             (ABSORBING_BORDER_WIDTH * simulation_parameters.viewportScale);
    let distanceToRightEdge = (simulation_parameters.viewportScale - normalizedPosition.x) / 
                              (ABSORBING_BORDER_WIDTH * simulation_parameters.viewportScale);
    let distanceToTopEdge = (simulation_parameters.viewportScale - normalizedPosition.y) / 
                            (ABSORBING_BORDER_WIDTH * simulation_parameters.viewportScale);
    let distanceToBottomEdge = (normalizedPosition.y + simulation_parameters.viewportScale) / 
                               (ABSORBING_BORDER_WIDTH * simulation_parameters.viewportScale);
    
    // Find the minimum distance to any edge
    let closestEdgeDistance = min(min(distanceToLeftEdge, distanceToRightEdge), 
                                  min(distanceToTopEdge, distanceToBottomEdge));
    
    // If we're inside the absorbing boundary region
    if (closestEdgeDistance < 1.0) {
        // Create a quadratic absorption profile (smoother transition)
        // Stronger absorption closer to edges
        let absorptionProfile = closestEdgeDistance * closestEdgeDistance;
        
        // Blend between strong absorption and no absorption
        // ABSORPTION_STRENGTH = 0.99 means we absorb 99% of wave energy at edges
        return mix(ABSORPTION_STRENGTH, 1.0, absorptionProfile);
    }
    
    // No absorption in central region
    return 1.0;
}