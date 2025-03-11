export class OpticsUniformSettings {
    // Store directly as real-world values
    deltaTime: number = 0.0;
    wavelength: number = 500.0;        // In nanometers
    slitWidth: number = 0.005;         // In millimeters
    grateWidth: number = 0.3;          // In millimeters
    numberOfSlits: number = 10.0;
    screenSize: number = 1.0;
    
    constructor(){
        this.deltaTime = 0.0;
        this.wavelength = 500.0;       // Green light (500nm)
        this.slitWidth = 0.005;        // 5 micrometers
        this.grateWidth = 0.3;         // 0.3mm
        this.numberOfSlits = 10.0;
        this.screenSize = 1.0;
    }
    
    // No conversion needed anymore - direct accessors
    getWavelengthNm(): number {
        return this.wavelength;
    }
    
    setWavelengthNm(wavelength: number): void {
        this.wavelength = wavelength;
    }
    
    getSlitWidthMm(): number {
        return this.slitWidth;
    }
    
    setSlitWidthMm(widthMm: number): void {
        this.slitWidth = widthMm;
    }
    
    getGrateWidthMm(): number {
        return this.grateWidth;
    }
    
    setGrateWidthMm(widthMm: number): void {
        this.grateWidth = widthMm;
    }
    
    update(pSettings: OpticsUniformSettings) {
        this.deltaTime = pSettings.deltaTime;
        this.wavelength = pSettings.wavelength;
        this.slitWidth = pSettings.slitWidth;
        this.grateWidth = pSettings.grateWidth;
        this.numberOfSlits = pSettings.numberOfSlits;
        this.screenSize = pSettings.screenSize;
    }
    
    // Updated rendering function
    renderSettingsUI(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    
        ctx.fillText('Scene Parameters', 10, 10);
        ctx.font = '12px Arial';
        
        ctx.fillText(`Delta Time: ${this.deltaTime.toFixed(2)}`, 10, 40);
        
        ctx.fillStyle = 'green';
        ctx.fillText(`Wavelength: ${this.wavelength.toFixed(1)} nm`, 10, 500);
        
        ctx.fillStyle = 'white';
        ctx.fillText(`Slit Width: ${this.slitWidth.toFixed(3)} mm`, 10, 80);
        ctx.fillText(`Grate Width: ${this.grateWidth.toFixed(2)} mm`, 10, 100);
        ctx.fillText(`Number of Slits: ${this.numberOfSlits}`, 10, 120);
        ctx.fillText(`Screen Size Multiplier: ${this.screenSize}`, 10, 140);
        ctx.fillText(`Diffraction Angle: ${this.getDiffractionAngle().toFixed(2)}°`, 10, 160);
    }

    // Updated diffraction angle calculation with real values
    getDiffractionAngle(): number {
        const wavelengthMeters = this.wavelength * 1e-9; 
        const slitSeparationMeters = this.grateWidth * 2e-3 / Math.max(1, this.numberOfSlits - 1);
        return Math.asin(wavelengthMeters / slitSeparationMeters) * 180 / Math.PI;
    }
}


