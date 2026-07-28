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

fn getPropagationDirectionVector() -> vec2<f32> {
    if (simulation_parameters.propagationDirection < 0.5) {
        return vec2<f32>(0.0, -1.0); // Top -> Bottom
    }
    if (simulation_parameters.propagationDirection < 1.5) {
        return vec2<f32>(0.0, 1.0); // Bottom -> Top
    }
    return vec2<f32>(-1.0, 0.0); // Left -> Right
}

fn getPlaneWavePhase(position: vec2<f32>, wavelength: f32, time: f32, direction: vec2<f32>) -> f32 {
    let baseSpeed = 15.0;
    let frequency = (baseSpeed / (wavelength * 0.01)) * simulation_parameters.emitterFrequencyScale;
    let spatialFreq = 6.28 / (wavelength * 0.01);
    return -spatialFreq * dot(position, direction) + frequency * time;
}

fn getGratingAnchor() -> vec2<f32> {
    let textureDims = vec2<f32>(f32(textureDimensions(electricField).x), f32(textureDimensions(electricField).y));
    let aspectRatio = textureDims.x / max(textureDims.y, 1.0);
    let verticalScale = simulation_parameters.viewportScale;
    let horizontalScale = simulation_parameters.viewportScale * aspectRatio;

    var scaleForOffset: f32 = verticalScale;
    if (simulation_parameters.propagationDirection > 1.5) {
        scaleForOffset = horizontalScale;
    }

    let emitterBandThickness = simulation_parameters.emitterBandHeight * scaleForOffset;
    let gratingOffset = simulation_parameters.slitPositionY * scaleForOffset;

    if (simulation_parameters.propagationDirection < 0.5) {
        return vec2<f32>(0.0, -verticalScale + emitterBandThickness + gratingOffset);
    }
    if (simulation_parameters.propagationDirection < 1.5) {
        return vec2<f32>(0.0, verticalScale - emitterBandThickness - gratingOffset);
    }
    return vec2<f32>(-horizontalScale + emitterBandThickness + gratingOffset, 0.0);
}

fn getGratingNormal() -> vec2<f32> {
    if (simulation_parameters.propagationDirection < 1.5) {
        return vec2<f32>(0.0, 1.0);
    }
    return vec2<f32>(1.0, 0.0);
}

fn getGratingHalfThickness() -> f32 {
    return max(0.01 * simulation_parameters.viewportScale, simulation_parameters.slitThickness * simulation_parameters.viewportScale);
}

fn getSlitPlaneKeepFactor() -> f32 {
    let absorption = clamp(simulation_parameters.slitPlaneAbsorption, 0.0, 1.0);
    return 1.0 - absorption;
}

// Function to determine if a point is within the diffraction grating material
// Returns true for points in the grating material, false for points in slits
fn isInDiffractionGrating(normalizedPosition: vec2<f32>) -> bool {
    let gratingAnchor = getGratingAnchor();
    let gratingHalfThickness = getGratingHalfThickness();
    let gratingNormal = getGratingNormal();

    if (abs(dot(normalizedPosition - gratingAnchor, gratingNormal)) > gratingHalfThickness) {
        return false;
    }

    let tangent = vec2<f32>(-gratingNormal.y, gratingNormal.x);
    let projected = dot(normalizedPosition - gratingAnchor, tangent);

    for (var i = 0; i < i32(simulation_parameters.numberOfSlits); i = i + 1) {
        var slitPosition: f32 = 0.0;
        if (simulation_parameters.numberOfSlits <= 1.0) {
            slitPosition = 0.5;
        } else {
            slitPosition = f32(i) / (simulation_parameters.numberOfSlits - 1.0);
        }

        let slitCenter = -simulation_parameters.grateWidth +
                         (2.0 * simulation_parameters.grateWidth * slitPosition);

        if (abs(projected - slitCenter) < (simulation_parameters.slitWidth * 0.5)) {
            return false;
        }
    }
    return true;
}

// Function to check if a point is inside a slit
fn isInsideSlit(normalizedPosition: vec2<f32>) -> bool {
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