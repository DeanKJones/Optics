// Helper functions for FDTD simulation
#include "fdtdCommon.wgsl"

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
    return spatialFreq * length(position) + frequency * time;
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
            slitPosition = 0.5;  // Center single slit
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

// Function to check if a point is inside a slit
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
        let absorptionProfile = closestEdgeDistance * closestEdgeDistance;
        
        // Blend between strong absorption and no absorption
        return mix(ABSORPTION_STRENGTH, 1.0, absorptionProfile);
    }
    
    // No absorption in central region
    return 1.0;
}