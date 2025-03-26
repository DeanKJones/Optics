// ---------------------------------------------------------------------------
// Common definitions for wave optics simulation
// ---------------------------------------------------------------------------
const TAU: f32 = 6.2831853;
const GRATE_HEIGHT: f32 = -0.95;
const EMITTER_DENSITY: f32 = 20.0; // Emitters per unit width

const diffractionWidth: f32 = 0.005;
const SPEED_OF_LIGHT: f32 = 299792458.0; // Speed of light in m/s

// Bindings for all Wave shaders
@group(0) @binding(0)
var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1)
var<uniform> uniform_buffer: uniformBufferStruct; 

// Parameters controlling the simulation behavior
struct uniformBufferStruct {
    dt: f32,
    wavelength: f32,        // In nanometers
    slitWidth: f32,         // In millimeters
    grateWidth: f32,        // In millimeters
    numberOfSlits: f32,
    screenSizeMultiplier: f32,
}