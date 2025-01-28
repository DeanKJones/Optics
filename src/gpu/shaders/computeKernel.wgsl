
// ---------------------------------------------------------------------------
// Constants (replace or adjust as necessary)
// ---------------------------------------------------------------------------
const TAU: f32          = 6.2831853;
const GRATE_HEIGHT: f32 = -0.95;

const diffractionWidth: f32 = 0.005;

// ---------------------------------------------------------------------------
struct uniformBufferStruct {
    dt: f32,
    frequency: f32,
    slitWidth: f32,
    grateWidth: f32,
    numberOfSlits: f32,
    screenSizeMultiplier: f32,
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

    // Prepare accumulation
    var amplitude: f32 = 0.0;
    var minDistanceToSlit: f32 = 1e6;

    let grateHeight = GRATE_HEIGHT * uniform_buffer.screenSizeMultiplier;

    let numberOfSlits = i32(uniform_buffer.numberOfSlits);

    for (var i = 0; i < numberOfSlits; i = i + 1) {
        let frac = f32(i) / (uniform_buffer.numberOfSlits - 1.0);
        let horizontalSlitCoordinate = -uniform_buffer.grateWidth + (2.0 * uniform_buffer.grateWidth) * frac;

        // vertical bar SDF at slit x position
        let distToSlit = abs(uv.x - horizontalSlitCoordinate) - uniform_buffer.slitWidth * 0.5;
        minDistanceToSlit = min(minDistanceToSlit, distToSlit);

    
        // wave accumulation
        if (uv.y > grateHeight) {
            // Here uniform.dt acts as the phase
            amplitude = amplitude + wave(uv, horizontalSlitCoordinate, uniform_buffer.frequency, uniform_buffer.dt);
        } else {
            amplitude = amplitude + parallelWave(uv.y, uniform_buffer.frequency, uniform_buffer.dt, uniform_buffer.numberOfSlits);
        }
    }

    // Average over the slits
    amplitude = amplitude / uniform_buffer.numberOfSlits;
    amplitude *= uniform_buffer.screenSizeMultiplier * 2.0;

    minDistanceToSlit = max(-minDistanceToSlit, abs(uv.y - grateHeight) - diffractionWidth * 0.5);
    let color = simpleAmplitudeToColor(amplitude) + ss(minDistanceToSlit, resolution.y) * vec3<f32>(1.0, 1.0, 1.0);

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
