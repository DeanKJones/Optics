#include "voxelSpaceHelpers.wgsl"

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size = vec2<i32>(textureDimensions(outputTexture));
    let screen_pos = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
    
    // Check if within bounds
    if (screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y) {
        return;
    }
    
    // Default sky color (can be adjusted)
    var color = vec4<f32>(0.6, 0.8, 1.0, 1.0);
    
    // Initialize height buffer for this column (equivalent to "hidden" array in Python code)
    let column = screen_pos.x;
    let columnWidth = f32(screen_size.x);
    
    // Raycast from front to back
    let maxDepth = min(settings.distance, 1024.0); // Limit max distance
    let rayAngle = settings.angle;
    let sinAngle = sin(rayAngle);
    let cosAngle = cos(rayAngle);
    
    // Maximum height on screen for this column (for hidden surface removal)
    var maxScreenHeight = 0.0; // Start from top of screen instead of bottom
    
    // Camera direction vectors
    let left = vec2<f32>(-cosAngle, sinAngle); // Perpendicular to camera direction
    let forward = vec2<f32>(sinAngle, cosAngle); // Camera forward vector
    
    // Normalized screen x position [-0.5, 0.5]
    let normalizedScreenX = (f32(column) / columnWidth) - 0.5;
    
    // Cast ray from near to far
    for (var z = 1.0; z < maxDepth; z += z / 100.0) { // Adaptive step size for better performance
        // Current point on the map
        let scaledX = normalizedScreenX * z;
        let rayPos = vec2<f32>(
            settings.positionX + forward.x * z + left.x * scaledX,
            settings.positionY + forward.y * z + left.y * scaledX
        );
        
        // Wrap coordinates to stay within map bounds
        let mapX = (rayPos.x % 1024.0 + 1024.0) % 1024.0;
        let mapY = (rayPos.y % 1024.0 + 1024.0) % 1024.0;
        
        // Sample height at this point
        let heightSample = sampleHeight(mapX, mapY);
        
        // Convert world height to screen height - FLIPPED for correct orientation
        let heightRelativeToCam = heightSample - settings.height;
        let screenHeight = (heightRelativeToCam * settings.scale) / z + settings.horizon;
        
        // If point is visible (below current min height for this column)
        if (screenHeight > maxScreenHeight) {
            // Only draw if point is within screen bounds
            if (screenHeight <= f32(screen_size.y) && f32(screen_pos.y) <= screenHeight) {
                // Sample color at this map position
                let texColor = sampleColor(mapX, mapY);
                
                // Apply simple depth fog effect
                let fogFactor = 1.0 - min(1.0, z / maxDepth);
                let shadedColor = mix(vec4<f32>(0.6, 0.8, 1.0, 1.0), texColor, fogFactor);
                
                // Only draw if current pixel is between maxScreenHeight and screenHeight
                if (f32(screen_pos.y) > maxScreenHeight) {
                    color = shadedColor;
                }
            }
            
            // Update max height for hidden surface removal
            maxScreenHeight = screenHeight;
        }
    }
    
    // Write final color to output texture
    textureStore(outputTexture, screen_pos, color);
}