
// ---------------------------------------------------------------------------
// Constants (replace or adjust as necessary)
// ---------------------------------------------------------------------------
const TAU: f32          = 6.2831853;
const GRATE_HEIGHT: f32 = -0.75;

const barrierWidth: f32 = 0.005;
const slitWidth: f32    = 0.01;
const grateWidth: f32   = 0.2;
const numSlits: f32     = 8.0;

// ---------------------------------------------------------------------------
struct uniformBufferStruct {
    dt: f32,
    frequency: f32,
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

    if (screen_pos.x < 0 || screen_pos.x >= screen_size.x
     || screen_pos.y < 0 || screen_pos.y >= screen_size.y) {
        return;
    }

    let fragCoord = vec2<f32>(f32(screen_pos.x), f32(screen_pos.y));
    let resolution = vec2<f32>(f32(screen_size.x), f32(screen_size.y));

    let uv = (2.0 * fragCoord - resolution) / resolution.y;

    // Prepare accumulation
    var amplitude: f32 = 0.0;
    var minDistanceToSlit: f32     = 1e6;

    let numberOfSlits = i32(numSlits);

    for (var i = 0; i < numberOfSlits; i = i + 1) {
        let frac = f32(i) / (numSlits - 1.0);
        let x = -grateWidth + (2.0 * grateWidth) * frac;

        // vertical bar SDF at slit x position
        let distToSlit = abs(uv.x - x) - slitWidth * 0.5;
        minDistanceToSlit = min(minDistanceToSlit, distToSlit);

        // wave accumulation
        if (uv.y > GRATE_HEIGHT) {
            amplitude = amplitude + wave(uv, x, uniform_buffer.frequency, uniform_buffer.dt);
        } else {
            amplitude = amplitude + parallelWave(uv.y, uniform_buffer.frequency, uniform_buffer.dt, numSlits);
        }
    }

    // Average over the slits
    amplitude = amplitude / numSlits;

    minDistanceToSlit = max(-minDistanceToSlit, abs(uv.y - GRATE_HEIGHT) - barrierWidth * 0.5);
    let color = simpleAmplitudeToColor(amplitude) + ss(minDistanceToSlit, resolution.y) * vec3<f32>(1.0, 1.0, 1.0);

    // Store to the screen buffer
    textureStore(color_buffer, screen_pos, vec4<f32>(color, 1.0));
}

// --------------------------------------
//              Functions
// --------------------------------------

// Smoothstep with a convenience signature
fn ss(minDistance: f32, resolution_y: f32) -> f32 {
    // Equivalent to: smoothstep(3./resolution.y, 0.0, c)
    let edge0 = 3.0 / resolution_y;
    let edge1 = 0.0;
    return smoothstep(edge0, edge1, minDistance);
}

// Convert amplitude to color
fn simpleAmplitudeToColor(amplitude: f32) -> vec3<f32> {
    // Red for negative, Blue for positive
    let r = max(0.0, -amplitude);
    let b = max(0.0,  amplitude);
    return vec3<f32>(r, 0.0, b);
}

// Wave from circular ripples
fn wave(uv: vec2<f32>, xOff: f32, frequency: f32, phase: f32) -> f32 {
    // distance from (xOff, GRATE_HEIGHT)
    let theta = length(uv - vec2<f32>(xOff, GRATE_HEIGHT));
    // sin( (theta*frequency - phase) * TAU ) / (theta^2 + 1)
    let arg = (theta * frequency - phase) * TAU;
    return sin(arg) / (theta * theta + 1.0);
}

// Wave for the flat case (above/below the barrier)
fn parallelWave(y: f32, frequency: f32, phase: f32, div: f32) -> f32 {
    return sin(TAU * (y * frequency - phase)) / div;
}
