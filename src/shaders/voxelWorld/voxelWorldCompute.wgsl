#include "voxelWorldCommon.wgsl"

// Main ray marching compute shader for voxel world
@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let screen_size = vec2<u32>(textureDimensions(color_output));
    let screen_pos = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
    
    // Check bounds
    if (screen_pos.x >= i32(screen_size.x) || screen_pos.y >= i32(screen_size.y)) {
        return;
    }
    
    // Calculate normalized device coordinates
    let uv = (vec2<f32>(f32(screen_pos.x), f32(screen_pos.y)) / vec2<f32>(f32(screen_size.x), f32(screen_size.y))) * 2.0 - 1.0;
    
    // Setup the camera ray
    let forward = vec3<f32>(
        sin(camera.rotation.y) * cos(camera.rotation.x),
        sin(camera.rotation.x),
        cos(camera.rotation.y) * cos(camera.rotation.x)
    );
    
    let right = normalize(cross(forward, vec3<f32>(0.0, 1.0, 0.0)));
    let up = normalize(cross(right, forward));
    
    let fov_factor = tan(camera.fov * 0.5);
    let ray_direction = normalize(
        forward + 
        right * uv.x * fov_factor * camera.aspect + 
        up * uv.y * fov_factor
    );
    
    // Ray marching parameters
    let max_steps = 100;
    let max_distance = 100.0;
    let epsilon = 0.001;
    
    // Ray marching
    var t = 0.0;
    var hit = false;
    var normal = vec3<f32>(0.0);
    var material_color = vec3<f32>(0.0);
    
    for (var i = 0; i < max_steps; i++) {
        let pos = camera.position + ray_direction * t;
        
        // Evaluate the scene distance
        let scene_result = scene_sdf(pos);
        let distance = scene_result.distance;
        
        if (distance < epsilon) {
            hit = true;
            
            // Calculate normal using numerical differentiation
            let e = vec2<f32>(epsilon, 0.0);
            normal = normalize(vec3<f32>(
                scene_sdf(pos + e.xyy).distance - scene_sdf(pos - e.xyy).distance,
                scene_sdf(pos + e.yxy).distance - scene_sdf(pos - e.yxy).distance,
                scene_sdf(pos + e.yyx).distance - scene_sdf(pos - e.yyx).distance
            ));
            
            material_color = scene_result.color;
            break;
        }
        
        // Step along the ray
        t += distance;
        
        // Break if we've gone too far
        if (t > max_distance) {
            break;
        }
    }
    
    // Sky gradient
    var color = vec3<f32>(0.6, 0.8, 1.0) - ray_direction.y * 0.6;
    
    if (hit) {
        // Simple lighting
        let light_dir = normalize(vec3<f32>(1.0, 0.8, 0.6));
        let light_intensity = 0.8;
        let ambient = 0.2;
        
        let diffuse = max(dot(normal, light_dir), 0.0) * light_intensity;
        color = material_color * (diffuse + ambient);
        
        // Add a slight fog effect based on distance
        let fog_factor = smoothstep(0.0, max_distance * 0.8, t);
        color = mix(color, vec3<f32>(0.6, 0.8, 1.0) - ray_direction.y * 0.6, fog_factor);
    }
    
    // Gamma correction
    color = pow(color, vec3<f32>(1.0 / 2.2));
    
    // Store the result
    textureStore(color_output, screen_pos, vec4<f32>(color, 1.0));
}

// Result from scene distance function
struct SceneResult {
    distance: f32,
    color: vec3<f32>,
}

// Evaluate the scene distance at a point
fn scene_sdf(p: vec3<f32>) -> SceneResult {
    // Start with a large distance
    var min_dist = 1000.0;
    var color = vec3<f32>(1.0, 1.0, 1.0);
    
    // Ground plane with voxel grid pattern
    let ground_dist = p.y + 1.0;
    if (ground_dist < min_dist) {
        min_dist = ground_dist;
        
        // Create a grid pattern for the ground
        let grid_size = 1.0;
        let grid_line_width = 0.05;
        
        // Check if we're on a grid line
        let grid_x = abs(fract(p.x / grid_size + 0.5) - 0.5) * grid_size;
        let grid_z = abs(fract(p.z / grid_size + 0.5) - 0.5) * grid_size;
        
        if (grid_x < grid_line_width || grid_z < grid_line_width) {
            color = vec3<f32>(0.2, 0.3, 0.4); // Grid line color
        } else {
            color = vec3<f32>(0.5, 0.6, 0.7); // Ground color
        }
    }
    
    // Procedural terrain with rolling hills
    let terrain_height = noise_terrain(p.xz);
    let terrain_dist = p.y - terrain_height;
    
    if (terrain_dist < min_dist) {
        min_dist = terrain_dist;
        
        // Terrain color based on height
        let height_factor = (terrain_height + 1.0) * 0.5; // Map from [-1,1] to [0,1]
        color = mix(
            vec3<f32>(0.2, 0.4, 0.1), // Valley color
            vec3<f32>(0.8, 0.7, 0.6), // Peak color
            height_factor
        );
    }
    
    // Voxel world terrain
    let voxel_grid_dist = voxel_grid_sdf(p);
    if (voxel_grid_dist.distance < min_dist) {
        min_dist = voxel_grid_dist.distance;
        color = voxel_grid_dist.color;
    }
    
    // Process active instances
    var instance_result = instance_sdf(p);
    if (instance_result.distance < min_dist) {
        min_dist = instance_result.distance;
        color = instance_result.color;
    }
    
    return SceneResult(min_dist, color);
}

// Generate a simple noise-based terrain
fn noise_terrain(pos: vec2<f32>) -> f32 {
    let scaled_pos = pos * 0.1;
    
    // Use a simple noise function based on sin waves
    // In a production environment, you'd use a more sophisticated noise function
    let noise = sin(scaled_pos.x * 3.0) * sin(scaled_pos.y * 2.0) * 0.4 +
                sin(scaled_pos.x * 0.5) * sin(scaled_pos.y * 0.7) * 0.8;
    
    return noise - 2.0; // Offset to be below the main voxel world
}

// Voxel grid SDF
fn voxel_grid_sdf(p: vec3<f32>) -> SceneResult {
    // Default result
    var result = SceneResult(1000.0, vec3<f32>(1.0));
    
    // Voxel size
    let voxel_size = world_params.voxel_size;
    let half_voxel = voxel_size * 0.5;
    let world_half_size = world_params.world_size * 0.5;
    
    // Check if we're in the world bounds
    if (abs(p.x) > world_half_size || p.y < 0.0 || p.y > world_params.world_size || abs(p.z) > world_half_size) {
        return result;
    }
    
    // Convert world position to voxel coordinates
    let voxel_pos = floor(p / voxel_size);
    
    // Determine if voxel exists based on procedural rules
    let noise_val = procedural_voxel(voxel_pos);
    
    if (noise_val > 0.5) {
        // Calculate distance to the voxel
        let voxel_center = (voxel_pos + 0.5) * voxel_size;
        let rel_pos = p - voxel_center;
        
        // Simple box SDF
        let d = sdf_box(rel_pos, vec3<f32>(half_voxel - 0.01));
        
        // Determine color based on position and noise
        let height_factor = voxel_pos.y / (world_params.world_size / voxel_size);
        let base_color = mix(
            vec3<f32>(0.1, 0.3, 0.8), // Bottom color (blue)
            vec3<f32>(0.8, 0.5, 0.2), // Top color (orange)
            height_factor
        );
        
        // Add some variation based on noise
        let color_var = (noise_val - 0.5) * 0.4;
        let color = base_color + vec3<f32>(color_var);
        
        result.distance = d;
        result.color = color;
    }
    
    return result;
}

// Determine if a voxel exists at a given position using procedural rules
fn procedural_voxel(voxel_pos: vec3<f32>) -> f32 {
    // Convert to integer for hashing
    let x = u32(voxel_pos.x * 10000.0 + 10000.0);
    let y = u32(voxel_pos.y * 10000.0 + 10000.0);
    let z = u32(voxel_pos.z * 10000.0 + 10000.0);
    
    // Generate pseudo-random value based on position
    let random_val = random_float(world_params.seed + hash(x + hash(y + hash(z))));
    
    // Simple terrain: higher probability of voxels at lower y
    let height_factor = 1.0 - (voxel_pos.y / 10.0);
    let height_probability = clamp(height_factor * 1.2, 0.0, 0.9);
    
    // Add some noise patterns
    let noise1 = sin(voxel_pos.x * 0.5) * sin(voxel_pos.z * 0.5) * 0.5 + 0.5;
    let noise2 = sin(voxel_pos.x * 0.2 + voxel_pos.z * 0.3) * 0.5 + 0.5;
    
    // Combine factors
    let threshold = height_probability * noise1 * noise2;
    
    // Time-varying factors for events
    let time_factor = sin(world_params.time * 0.1 + voxel_pos.x * 0.1 + voxel_pos.z * 0.1) * 0.5 + 0.5;
    
    // Event-triggered changes
    if (world_params.event_counter % 2u == 0u) {
        // Even events: add some vertical structures
        if (noise1 > 0.7 && voxel_pos.y < 10.0 * noise1) {
            return 0.8;
        }
    } else {
        // Odd events: add some horizontal platforms
        if (noise2 > 0.6 && abs(voxel_pos.y - 5.0 * noise2) < 1.0) {
            return 0.7;
        }
    }
    
    // Return the final value determining if a voxel exists
    return f32(random_val < threshold);
}

// Process all instances and return the closest hit
fn instance_sdf(p: vec3<f32>) -> SceneResult {
    var min_dist = 1000.0;
    var color = vec3<f32>(1.0);
    
    // Loop through all active instances
    for (var i = 0u; i < world_params.max_instances; i++) {
        if (instances[i].active == 0u) {
            continue;
        }
        
        // Get instance properties
        let instance_pos = instances[i].position;
        let instance_scale = instances[i].scale;
        let instance_color = instances[i].color.rgb;
        let instance_type = instances[i].instance_type;
        let rotation = instances[i].rotation;
        
        // Transform point to instance local space
        var local_p = p - instance_pos;
        
        // Apply rotation using quaternion
        local_p = quat_rotate_vector(rotation, local_p);
        
        // Apply scaling
        local_p = local_p / instance_scale;
        
        // Calculate SDF based on instance type
        var d = 1000.0;
        
        switch(instance_type) {
            case 1u: { // Cube
                d = sdf_box(local_p, vec3<f32>(0.5));
                break;
            }
            case 2u: { // Sphere
                d = sdf_sphere(local_p, 0.5);
                break;
            }
            case 3u: { // Torus
                d = sdf_torus(local_p, 0.35, 0.15);
                break;
            }
            default: { // Unknown type
                continue;
            }
        }
        
        // Scale distance back to world space
        d = d * instance_scale;
        
        // If this instance is closer than previous ones
        if (d < min_dist) {
            min_dist = d;
            color = instance_color;
            
            // Add pulsing effect for instances based on creation time
            let time_since_creation = world_params.time - instances[i].creation_time;
            let pulse = sin(time_since_creation * 3.0) * 0.2 + 0.8;
            color = color * pulse;
        }
    }
    
    return SceneResult(min_dist, color);
}