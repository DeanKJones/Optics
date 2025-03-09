// ---------------------------------------------------------------------------
// Constants (replace or adjust as necessary)
// ---------------------------------------------------------------------------
const TAU: f32 = 6.2831853;
const GRATE_HEIGHT: f32 = -0.95;
const EMITTER_DENSITY: f32 = 20.0; // Emitters per unit width

const diffractionWidth: f32 = 0.005;
const SPEED_OF_LIGHT: f32 = 299792458.0; // Speed of light in m/s

// ---------------------------------------------------------------------------
struct uniformBufferStruct {
    dt: f32,
    wavelength: f32,        // In nanometers
    slitWidth: f32,         // In millimeters
    grateWidth: f32,        // In millimeters
    numberOfSlits: f32,
    screenSizeMultiplier: f32,
}

// Helper function to convert wavelength in nm to simulation frequency
fn wavelengthToFrequency(wavelength_nm: f32) -> f32 {
    // Convert nm to m
    let wavelength_m = wavelength_nm * 1e-9;
    
    // For simulation purposes, we normalize around 500nm
    let normalized = 500.0 / wavelength_nm;
    
    return normalized;
}

// ---------------------------------------------------------------------------
// Main compute entry point
// ---------------------------------------------------------------------------
@group(0) @binding(0)
var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1)
var<uniform> uniform_buffer: uniformBufferStruct; 

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos: vec2<i32>  = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    if (screen_pos.x < 0 || screen_pos.x >= screen_size.x ||
        screen_pos.y < 0 || screen_pos.y >= screen_size.y) {
        return;
    }

    let fragCoord = vec2<f32>(f32(screen_pos.x), f32(screen_pos.y));
    let resolution = vec2<f32>(f32(screen_size.x), f32(screen_size.y));

    var uv = (2.0 * fragCoord - resolution) / resolution.y;
    uv.x = uniform_buffer.screenSizeMultiplier * f32(uv.x);
    uv.y = uniform_buffer.screenSizeMultiplier * f32(uv.y);

    let grateHeight = GRATE_HEIGHT * uniform_buffer.screenSizeMultiplier;
    let numberOfSlits = i32(uniform_buffer.numberOfSlits);
    var totalEmitters: i32 = 0;

    // Calculate frequency from wavelength
    let frequency = wavelengthToFrequency(uniform_buffer.wavelength) * 10.0;

    // Check if we're rendering the grating material itself
    if (isInDiffractionGrating(uv)) {
        // Render as solid white for grating material
        textureStore(color_buffer, screen_pos, vec4<f32>(1.0, 1.0, 1.0, 1.0));
        return;
    }

    // Calculate wave amplitudes
    var amplitude: f32 = 0.0;
    
    // If below the grating, show parallel waves
    if (uv.y < grateHeight) {
        amplitude = parallelWave(uv.y, frequency, uniform_buffer.dt, uniform_buffer.numberOfSlits);
    } else {
        // Above the grating, show interference pattern from all slits
        for (var i = 0; i < numberOfSlits; i = i + 1) {
            var frac = (uniform_buffer.numberOfSlits);
            if uniform_buffer.numberOfSlits > 1.0 {
                frac = f32(i) / (uniform_buffer.numberOfSlits - 1.0);
            }
            let horizontalSlitCoordinate = -uniform_buffer.grateWidth + (2.0 * uniform_buffer.grateWidth) * frac;

            // Calculate emitters for this slit based on width
            let emittersPerSlit = max(1, i32((uniform_buffer.slitWidth * 10.0) * EMITTER_DENSITY));
            totalEmitters += emittersPerSlit;

            for (var j = 0; j < emittersPerSlit; j = j + 1) {
                // Calculate position within the slit
                let emitterFrac = (f32(j) + 0.5) / f32(emittersPerSlit);
                let emitterOffset = (emitterFrac - 0.5) * uniform_buffer.slitWidth;
                let emitterPosition = horizontalSlitCoordinate + emitterOffset;
                
                // wave accumulation
                amplitude = amplitude + wave(uv, emitterPosition, frequency, uniform_buffer.dt);
            }
        }
        
        // Normalize amplitude
        amplitude = amplitude / f32(totalEmitters) * 2.0;
    }
    
    // Convert amplitude to color
    let color = simpleAmplitudeToColor(amplitude);
    
    // Store to the screen buffer
    textureStore(color_buffer, screen_pos, vec4<f32>(color, 1.0));
}

// --------------------------------------
//              Functions
// --------------------------------------

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
