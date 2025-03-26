// Main compute shader for wave optics simulation
#include "waveHelpers.wgsl"

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