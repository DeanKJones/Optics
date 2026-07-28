export enum WaveEmitterDirection {
    TopToBottom = 0,
    BottomToTop = 1,
    LeftToRight = 2,
}

export class OpticsUniformSettings {
    // Store directly as real-world values
    deltaTime: number = 0.0;
    wavelength: number = 500.0;        // In nanometers
    slitWidth: number = 0.005;         // In millimeters
    grateWidth: number = 0.3;          // In millimeters
    numberOfSlits: number = 10.0;
    screenSize: number = 1.0;
    slitPositionY: number = 0.02;      // Distance from the emitter band, as a fraction of viewport height/width
    slitThickness: number = 0.015;     // Fraction of full screen height
    propagationDirection: WaveEmitterDirection = WaveEmitterDirection.TopToBottom;
    emitterBandHeight: number = 0.02;  // 2% of pixels
    emitterAmplitude: number = 4.0;
    emitterFrequencyScale: number = 1.0;
    slitPlaneAbsorption: number = 1.0; // 1.0 = 100% absorption
    positiveColorR: number = 0.0;
    positiveColorG: number = 0.0;
    positiveColorB: number = 1.0;
    negativeColorR: number = 1.0;
    negativeColorG: number = 0.0;
    negativeColorB: number = 0.0;
    
    constructor(){
        this.deltaTime = 0.0;
        this.wavelength = 200.0;
        this.slitWidth = 0.035;
        this.grateWidth = 0.9;
        this.numberOfSlits = 6.0;
        this.screenSize = 2.0;
        this.slitPositionY = 0.02;
        this.slitThickness = 0.01;
        this.propagationDirection = WaveEmitterDirection.TopToBottom;
        this.emitterBandHeight = 0.02;
        this.emitterAmplitude = 2.0;
        this.emitterFrequencyScale = 1.0;
        this.slitPlaneAbsorption = 1.0;
        
        this.positiveColorR = 1.0;
        this.positiveColorG = 1.0;
        this.positiveColorB = 1.0;
        this.negativeColorR = 0.0;
        this.negativeColorG = 0.0;
        this.negativeColorB = 0.25;
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

    getSlitPositionY(): number {
        return this.slitPositionY;
    }

    setSlitPositionY(positionY: number): void {
        this.slitPositionY = Math.max(0.0, Math.min(1.0, positionY));
    }

    getSlitThickness(): number {
        return this.slitThickness;
    }

    setSlitThickness(thickness: number): void {
        this.slitThickness = Math.max(0.0, thickness);
    }

    setPropagationDirection(direction: WaveEmitterDirection): void {
        this.propagationDirection = direction;
    }

    setEmitterAmplitude(amplitude: number): void {
        this.emitterAmplitude = Math.max(0.0, amplitude);
    }

    setEmitterFrequencyScale(scale: number): void {
        this.emitterFrequencyScale = Math.max(0.01, scale);
    }

    setSlitPlaneAbsorption(absorption: number): void {
        this.slitPlaneAbsorption = Math.max(0.0, Math.min(1.0, absorption));
    }

    setPositiveColor(color: { r: number; g: number; b: number }): void {
        this.positiveColorR = color.r;
        this.positiveColorG = color.g;
        this.positiveColorB = color.b;
    }

    setNegativeColor(color: { r: number; g: number; b: number }): void {
        this.negativeColorR = color.r;
        this.negativeColorG = color.g;
        this.negativeColorB = color.b;
    }

    getPositiveColorHex(): string {
        return this.rgbToHex(this.positiveColorR, this.positiveColorG, this.positiveColorB);
    }

    getNegativeColorHex(): string {
        return this.rgbToHex(this.negativeColorR, this.negativeColorG, this.negativeColorB);
    }

    private rgbToHex(r: number, g: number, b: number): string {
        const toHex = (v: number) => {
            const clamped = Math.max(0, Math.min(1, v));
            return Math.round(clamped * 255).toString(16).padStart(2, '0');
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    update(pSettings: OpticsUniformSettings) {
        this.deltaTime = pSettings.deltaTime;
        this.wavelength = pSettings.wavelength;
        this.slitWidth = pSettings.slitWidth;
        this.grateWidth = pSettings.grateWidth;
        this.numberOfSlits = pSettings.numberOfSlits;
        this.screenSize = pSettings.screenSize;
        this.slitPositionY = pSettings.slitPositionY;
        this.slitThickness = pSettings.slitThickness;
        this.propagationDirection = pSettings.propagationDirection;
        this.emitterBandHeight = pSettings.emitterBandHeight;
        this.emitterAmplitude = pSettings.emitterAmplitude;
        this.emitterFrequencyScale = pSettings.emitterFrequencyScale;
        this.slitPlaneAbsorption = pSettings.slitPlaneAbsorption;
        this.positiveColorR = pSettings.positiveColorR;
        this.positiveColorG = pSettings.positiveColorG;
        this.positiveColorB = pSettings.positiveColorB;
        this.negativeColorR = pSettings.negativeColorR;
        this.negativeColorG = pSettings.negativeColorG;
        this.negativeColorB = pSettings.negativeColorB;
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
        ctx.fillText(`Slit Position: ${(this.slitPositionY * 100).toFixed(1)}% down`, 10, 160);
        ctx.fillText(`Slit Thickness: ${(this.slitThickness * 100).toFixed(2)}%`, 10, 180);
        ctx.fillText(`Emitter: Bottom ${ (this.emitterBandHeight * 100).toFixed(1)}%`, 10, 200);
        ctx.fillText(`Slit Plane Absorption: ${(this.slitPlaneAbsorption * 100).toFixed(0)}%`, 10, 240);
        ctx.fillText(`Diffraction Angle: ${this.getDiffractionAngle().toFixed(2)}°`, 10, 260);
    }

    // Updated diffraction angle calculation with real values
    getDiffractionAngle(): number {
        const wavelengthMeters = this.wavelength * 1e-9; 
        const slitSeparationMeters = this.grateWidth * 2e-3 / Math.max(1, this.numberOfSlits - 1);
        return Math.asin(wavelengthMeters / slitSeparationMeters) * 180 / Math.PI;
    }
}


