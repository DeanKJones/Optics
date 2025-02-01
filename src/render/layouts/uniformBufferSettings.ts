type NumericKeys = Exclude<keyof UniformSettings, "update" | "setProperty" | "renderSettingsUI">;

export class UniformSettings {

    deltaTime: number = 0.0;
    frequency: number = 25.0;
    slitWidth: number = 0.005;
    grateWidth: number = 0.3;
    numberOfSlits: number = 10.0;
    screenSize: number = 1.0;

    constructor(){
        this.deltaTime = 0.0;
        this.frequency = 35.0;
        this.slitWidth = 0.005;
        this.grateWidth = 0.3;
        this.numberOfSlits = 10.0;
        this.screenSize = 1.0;
    }

    update(pSettings: UniformSettings) {
        this.deltaTime = pSettings.deltaTime;
        this.frequency = pSettings.frequency;
        this.slitWidth = pSettings.slitWidth;
        this.grateWidth = pSettings.grateWidth;
        this.numberOfSlits = pSettings.numberOfSlits;
        this.screenSize = pSettings.screenSize;
    }

    // I honestly don't quite get this code
    setProperty(key: NumericKeys, value: number) {
        this[key] = value;
    }

    renderSettingsUI(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        // Header style
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    
        // Scene Parameters Header
        ctx.fillText('Scene Parameters', 10, 10);
    
        // Regular text style
        ctx.font = '12px Arial';
    
        // Scene Parameters
        ctx.fillText(`Delta Time: ${this.deltaTime}`, 10, 40);
        ctx.fillText(`Frequency: ${this.frequency}`, 10, 60);
        ctx.fillText(`Diffraction Slit Width: ${this.slitWidth}`, 10, 80);
        ctx.fillText(`Diffraction Grate Width: ${this.grateWidth}`, 10, 100);
        ctx.fillText(`Number of Slits: ${this.numberOfSlits}`, 10, 120);
        ctx.fillText(`Screen Size Multiplier: ${this.screenSize}`, 10, 140);
    }
}


