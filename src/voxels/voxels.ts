// src/voxel.ts
import { VoxelApp } from "./voxel/voxelApp";

const canvases = {
    voxelMain: <HTMLCanvasElement>document.getElementById("voxel-main"),
    settingsMain: <HTMLCanvasElement>document.getElementById("voxel-settings")
};

const app = new VoxelApp(canvases);
app.run();