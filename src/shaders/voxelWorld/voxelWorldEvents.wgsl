#include "voxelWorldCommon.wgsl"

// This compute shader handles time-based events and instance management
@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    // Skip if we're not the first thread
    if (GlobalInvocationID.x != 0u || GlobalInvocationID.y != 0u || GlobalInvocationID.z != 0u) {
        return;
    }
    
    // Process time-based events
    process_events();
    
    // Update existing instances
    update_instances();
}

// Process time-based events in the world
fn process_events() {
    // Check if it's time for a new event
    let current_event_index = u32(world_params.time / world_params.event_interval);
    
    // If we already processed this event, skip
    if (current_event_index == world_params.event_counter) {
        return;
    }
    
    // New event occurred, update the counter
    // Note: In a real implementation, this would need atomic operations since 
    // we're writing to a value that other workgroups might read
    // instances[0].active = current_event_index; // For debugging
    
    // Get event type based on the counter (cycle through different events)
    let event_type = current_event_index % 4u;
    
    switch(event_type) {
        case 0u: {
            // Event: Spawn a group of cubes in a circle
            spawn_circle_formation(8u, 1u, 10.0, vec3<f32>(0.8, 0.2, 0.2));
            break;
        }
        case 1u: {
            // Event: Spawn a line of spheres
            spawn_line_formation(5u, 2u, 8.0, vec3<f32>(0.2, 0.8, 0.2));
            break;
        }
        case 2u: {
            // Event: Spawn a cluster of tori
            spawn_cluster_formation(6u, 3u, 5.0, vec3<f32>(0.2, 0.2, 0.8));
            break;
        }
        case 3u: {
            // Event: Spawn a single large object at the center
            let instance_id = find_available_instance();
            if (instance_id < world_params.max_instances) {
                create_instance(
                    instance_id,
                    vec3<f32>(0.0, 10.0, 0.0),  // Position high in the air
                    3.0,                        // Large scale
                    vec3<f32>(0.9, 0.9, 0.2),   // Yellow color
                    1u + current_event_index % 3u, // Cycle through types
                    15.0                        // Longer lifetime
                );
            }
            break;
        }
        default: {
            break;
        }
    }
    
    // Update event counter for next time
    // In actual implementation, we would need proper memory barriers and atomics
    instances[0].active = world_params.event_counter;
}

// Update all active instances
fn update_instances() {
    for (var i = 0u; i < world_params.max_instances; i++) {
        if (instances[i].active == 0u) {
            continue;
        }
        
        // Check if instance has expired
        let age = world_params.time - instances[i].creation_time;
        if (age > instances[i].lifetime) {
            instances[i].active = 0u; // Deactivate
            continue;
        }
        
        // Apply instance-specific animations/physics
        update_instance_animation(i, age);
    }
}

// Apply animations to an instance based on its type and age
fn update_instance_animation(instance_id: u32, age: f32) {
    let instance_type = instances[instance_id].instance_type;
    let lifetime_ratio = age / instances[instance_id].lifetime;
    
    switch(instance_type) {
        case 1u: { // Cube
            // Cubes bob up and down
            instances[instance_id].position.y = instances[instance_id].position.y + 
                                               sin(world_params.time * 2.0 + f32(instance_id)) * 0.03;
            
            // And slowly rotate
            let rotation_axis = normalize(vec3<f32>(1.0, 1.0, 0.0));
            let rotation_angle = world_params.time * 0.5 + f32(instance_id) * 0.1;
            instances[instance_id].rotation = quat_from_axis_angle(rotation_axis, rotation_angle);
            break;
        }
        case 2u: { // Sphere
            // Spheres pulse in size
            let pulse = 1.0 + sin(world_params.time * 3.0 + f32(instance_id)) * 0.2;
            let base_scale = instances[instance_id].scale / (1.0 + sin(instances[instance_id].creation_time * 3.0 + f32(instance_id)) * 0.2);
            instances[instance_id].scale = base_scale * pulse;
            
            // And fade out as they approach their lifetime
            if (lifetime_ratio > 0.5) {
                instances[instance_id].color.a = 1.0 - (lifetime_ratio - 0.5) * 2.0;
            }
            break;
        }
        case 3u: { // Torus
            // Tori spin rapidly
            let rotation_axis = normalize(vec3<f32>(0.0, 1.0, 0.0));
            let rotation_angle = world_params.time * 2.0 + f32(instance_id) * 0.2;
            instances[instance_id].rotation = quat_from_axis_angle(rotation_axis, rotation_angle);
            
            // And float upward
            instances[instance_id].position.y = instances[instance_id].position.y + 0.01;
            break;
        }
        default: {
            break;
        }
    }
}

// Find an available instance slot
fn find_available_instance() -> u32 {
    for (var i = 1u; i < world_params.max_instances; i++) {
        if (instances[i].active == 0u) {
            return i;
        }
    }
    return world_params.max_instances; // All slots are used
}

// Create a new instance
fn create_instance(
    instance_id: u32,
    position: vec3<f32>,
    scale: f32,
    color: vec3<f32>,
    instance_type: u32,
    lifetime: f32
) {
    instances[instance_id].position = position;
    instances[instance_id].scale = scale;
    instances[instance_id].color = vec4<f32>(color, 1.0);
    instances[instance_id].rotation = vec4<f32>(0.0, 0.0, 0.0, 1.0); // Identity quaternion
    instances[instance_id].instance_type = instance_type;
    instances[instance_id].active = 1u;
    instances[instance_id].creation_time = world_params.time;
    instances[instance_id].lifetime = lifetime;
}

// Spawn instances in a circle formation
fn spawn_circle_formation(count: u32, instance_type: u32, radius: f32, color: vec3<f32>) {
    for (var i = 0u; i < count; i++) {
        let angle = f32(i) / f32(count) * 6.28318;
        let position = vec3<f32>(
            cos(angle) * radius,
            3.0, // Height above ground
            sin(angle) * radius
        );
        
        let instance_id = find_available_instance();
        if (instance_id < world_params.max_instances) {
            create_instance(
                instance_id,
                position,
                1.0, // Scale
                color,
                instance_type,
                10.0 // Lifetime
            );
        }
    }
}

// Spawn instances in a line formation
fn spawn_line_formation(count: u32, instance_type: u32, length: f32, color: vec3<f32>) {
    for (var i = 0u; i < count; i++) {
        let t = f32(i) / f32(count - 1u);
        let position = vec3<f32>(
            (t - 0.5) * length,
            5.0, // Height above ground
            0.0
        );
        
        let instance_id = find_available_instance();
        if (instance_id < world_params.max_instances) {
            create_instance(
                instance_id,
                position,
                0.8 + t * 0.4, // Gradually increasing scale
                mix(color, vec3<f32>(1.0), t * 0.5), // Gradient color
                instance_type,
                8.0 + t * 4.0 // Varied lifetime
            );
        }
    }
}

// Spawn instances in a random cluster
fn spawn_cluster_formation(count: u32, instance_type: u32, spread: f32, color: vec3<f32>) {
    let seed_base = u32(world_params.time * 1000.0);
    
    for (var i = 0u; i < count; i++) {
        // Generate a random position within the spread
        let rand_x = (random_float(seed_base + i * 3u) - 0.5) * spread;
        let rand_y = random_float(seed_base + i * 3u + 1u) * 5.0 + 2.0; // Height between 2-7
        let rand_z = (random_float(seed_base + i * 3u + 2u) - 0.5) * spread;
        
        let position = vec3<f32>(rand_x, rand_y, rand_z);
        
        let instance_id = find_available_instance();
        if (instance_id < world_params.max_instances) {
            create_instance(
                instance_id,
                position,
                0.5 + random_float(seed_base + i * 3u + 3u) * 0.5, // Random scale between 0.5-1.0
                mix(color, vec3<f32>(1.0, 1.0, 1.0), random_float(seed_base + i * 3u + 4u) * 0.3), // Slight color variation
                instance_type,
                5.0 + random_float(seed_base + i * 3u + 5u) * 5.0 // Random lifetime between 5-10
            );
        }
    }
}