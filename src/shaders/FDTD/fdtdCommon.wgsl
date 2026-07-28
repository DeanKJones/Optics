// Common definitions for FDTD simulation

// Bindings for all FDTD shaders
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
    slitPositionY: f32,            // Fraction from the selected edge
    slitThickness: f32,            // Fraction of full screen height
    propagationDirection: f32,     // 0 top->bottom, 1 bottom->top, 2 left->right, 3 right->left
    emitterBandHeight: f32,        // Fraction of screen height used as emitter band
    emitterAmplitude: f32,         // Source amplitude
    emitterFrequencyScale: f32,    // Multiplier applied to source frequency
    slitPlaneAbsorption: f32,      // 0..1 absorption in slit/grating material
    positiveColorR: f32,
    positiveColorG: f32,
    positiveColorB: f32,
    negativeColorR: f32,
    negativeColorG: f32,
    negativeColorB: f32,
}

// Physical constants
const SPEED_OF_LIGHT: f32 = 1.0;                // Normalized light speed
const FREE_SPACE_IMPEDANCE: f32 = 377.0;        // Impedance of free space (ohms)
const ABSORBING_BORDER_WIDTH: f32 = 0.15;       // Width of absorbing boundary (fraction of screen)
const ABSORPTION_STRENGTH: f32 = 0.99;          // Absorption coefficient (0-1)