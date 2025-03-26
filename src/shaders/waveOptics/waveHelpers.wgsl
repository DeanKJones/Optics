// Helper functions for wave optics simulation
#include "waveCommon.wgsl"

// Helper function to convert wavelength in nm to simulation frequency
fn wavelengthToFrequency(wavelength_nm: f32) -> f32 {
    // Convert nm to m
    let wavelength_m = wavelength_nm * 1e-9;
    
    // For simulation purposes, we normalize around 500nm
    let normalized = 500.0 / wavelength_nm;
    
    return normalized;
}

// Smoothstep with a convenience signature
fn ss(minDistance: f32, resolution_y: f32) -> f32 
{
    // Equivalent to: smoothstep(3./resolution.y, 0.0, Minimum Distance)
    let edge0 = 1.0 / resolution_y;
    let edge1 = 0.0;
    return smoothstep(edge0, edge1, minDistance);
}

// Convert amplitude to color
fn simpleAmplitudeToColor(amplitude: f32) -> vec3<f32> 
{
    // Red for negative, Blue for positive
    let red = max(0.0, -amplitude);
    let blue = max(0.0, amplitude);
    return vec3<f32>(red, 0.0, blue);
}

// Wave from circular ripples
fn wave(uv: vec2<f32>, xOff: f32, frequency: f32, phase: f32) -> f32 
{
    let theta = length(uv - vec2<f32>(xOff, GRATE_HEIGHT * uniform_buffer.screenSizeMultiplier));

    /* 
     * float amplitude = sin((theta * frequency - phase) * TAU) / (theta^2 + 1)
     *
     *  Where:
     *   - Theta: is the distance from the center of the ripple
     *   - Frequency: is the frequency of the ripple
     *   - Phase: is the phase of the wave
     *   - TAU: is 2 * PI as f32
     */
    let arg = (theta * frequency - phase) * TAU;
    return sin(arg) / (theta * theta + 1.0);
}

// Wave for the flat case (above/below the diffraction grid)
fn parallelWave(y: f32, frequency: f32, phase: f32, div: f32) -> f32 {
    return sin(TAU * (y * frequency - phase)) / div;
}

fn isInDiffractionGrating(normalizedPosition: vec2<f32>) -> bool {
    // Scale the grating height by the viewport scale
    let gratingHeight = GRATE_HEIGHT * uniform_buffer.screenSizeMultiplier;
    
    // First check if we're near the grating's y-position
    if (abs(normalizedPosition.y - gratingHeight) > 0.05) {
        return false; // Not at grating height
    }
    
    // Special case for single slit
    if (uniform_buffer.numberOfSlits <= 1.0) {
        // Check if we're within the slit
        if (abs(normalizedPosition.x) < (uniform_buffer.slitWidth * 0.5)) {
            return false; // In the slit (not in grating material)
        }
        return true; // Not in slit, but at grating height = in grating material
    }
    
    // Multiple slits - check each slit position
    for (var i = 0; i < i32(uniform_buffer.numberOfSlits); i = i + 1) {
        var slitPosition: f32 = 0.0;
        
        if (uniform_buffer.numberOfSlits <= 1.0) {
            slitPosition = 0.5;  // Center single slit
        } else {
            slitPosition = f32(i) / (uniform_buffer.numberOfSlits - 1.0);
        }
        
        let slitCenterX = -uniform_buffer.grateWidth + 
                          (2.0 * uniform_buffer.grateWidth * slitPosition);
        
        // Check if point is within this slit
        if (abs(normalizedPosition.x - slitCenterX) < (uniform_buffer.slitWidth * 0.5)) {
            return false; // In a slit (not in grating material)
        }
    }
    // At grating height but not in any slit = in grating material
    return true;
}

// Function to determine if a point is inside a slit
fn isInsideSlit(normalizedPosition: vec2<f32>) -> bool {
    let gratingHeight = GRATE_HEIGHT * uniform_buffer.screenSizeMultiplier;
    
    // Check if we're near the grating's y-position
    if (abs(normalizedPosition.y - gratingHeight) > 0.05) {
        return false; // Not at grating height
    }
    
    // We can leverage the existing grating function - if it's not in grating material,
    // and it's at the grating height, then it must be inside a slit
    return !isInDiffractionGrating(normalizedPosition);
}