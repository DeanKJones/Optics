// Common definitions for voxel world rendering

// Bindings for all VoxelWorld shaders
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> world_params: WorldParameters;
@group(0) @binding(2) var<storage, read_write> instances: array<Instance>;
@group(0) @binding(3) var color_output: texture_storage_2d<rgba8unorm, write>;

// Camera structure
struct Camera {
    position: vec3<f32>,
    rotation: vec2<f32>,    // pitch, yaw in radians
    fov: f32,               // field of view in radians
    aspect: f32,            // aspect ratio
    near: f32,              // near plane
    far: f32,               // far plane
    movement_speed: f32,    // for camera movement
}

// World parameters
struct WorldParameters {
    time: f32,              // Current global time
    seed: u32,              // Random seed for world generation
    voxel_size: f32,        // Size of each voxel
    world_size: f32,        // Size of the entire world
    max_instances: u32,     // Maximum number of instances
    event_interval: f32,    // Time between events
    event_counter: u32,     // Counter for timed events
    padding: f32,           // Padding for alignment
}

// Instance data for objects
struct Instance {
    position: vec3<f32>,
    scale: f32,
    color: vec4<f32>,
    rotation: vec4<f32>,    // quaternion
    instance_type: u32,     // 0 = none, 1 = cube, 2 = sphere, 3 = torus
    active: u32,            // 0 = inactive, 1 = active
    creation_time: f32,     // When the instance was created
    lifetime: f32,          // How long the instance should exist
}

// A 3D signed distance function for a sphere
fn sdf_sphere(p: vec3<f32>, radius: f32) -> f32 {
    return length(p) - radius;
}

// A 3D signed distance function for a box
fn sdf_box(p: vec3<f32>, size: vec3<f32>) -> f32 {
    let d = abs(p) - size;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, vec3<f32>(0.0)));
}

// A 3D signed distance function for a torus
fn sdf_torus(p: vec3<f32>, r1: f32, r2: f32) -> f32 {
    let q = vec2<f32>(length(p.xz) - r1, p.y);
    return length(q) - r2;
}

// Random functions
fn hash(value: u32) -> u32 {
    var state = value;
    state = state ^ 2747636419u;
    state = state * 2654435769u;
    state = state ^ (state >> 16u);
    state = state * 2654435769u;
    state = state ^ (state >> 16u);
    state = state * 2654435769u;
    return state;
}

fn random_float(seed: u32) -> f32 {
    return f32(hash(seed)) / 4294967295.0;
}

fn random_vec3(seed: u32) -> vec3<f32> {
    return vec3<f32>(
        random_float(seed),
        random_float(seed + 1u),
        random_float(seed + 2u)
    );
}

// Quaternion functions
fn quat_from_axis_angle(axis: vec3<f32>, angle: f32) -> vec4<f32> {
    let half_angle = angle * 0.5;
    let s = sin(half_angle);
    return vec4<f32>(axis.x * s, axis.y * s, axis.z * s, cos(half_angle));
}

fn quat_rotate_vector(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
    let u = vec3<f32>(q.x, q.y, q.z);
    let s = q.w;
    return 2.0 * dot(u, v) * u + (s*s - dot(u, u)) * v + 2.0 * s * cross(u, v);
}