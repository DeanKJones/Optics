import { RenderContext } from "../../render/renderContext";

export class RenderContextUI {
    private context: RenderContext;
    private container: HTMLDivElement;
    private isExpanded: boolean = true;
    
    constructor(context: RenderContext) {
        this.context = context;
        this.container = this.createContainer();
        document.body.appendChild(this.container);
        
        // Initial render
        this.update();
    }
    
    /**
     * Create the container for the render context display
     */
    private createContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'render-context';
        container.innerHTML = `
            <div class="render-context-header">
                Render Context <span id="context-toggle">[−]</span>
            </div>
            <div class="render-context-content">
                <div class="render-stat">
                    <span class="stat-name">FPS:</span>
                    <span class="stat-value" id="fps-value">0</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Frame:</span>
                    <span class="stat-value" id="frame-value">0</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Delta:</span>
                    <span class="stat-value" id="delta-value">0.0 ms</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Mode:</span>
                    <span class="stat-value" id="mode-value">wave</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Pass:</span>
                    <span class="stat-value" id="pass-value">-</span>
                </div>
                <div class="render-stat">
                    <span class="stat-name">Resolution:</span>
                    <span class="stat-value" id="resolution-value">-</span>
                </div>
                <div id="custom-metrics"></div>
            </div>
        `;
        
        // Add toggle functionality
        const header = container.querySelector('.render-context-header') as HTMLDivElement;
        const toggleSpan = container.querySelector('#context-toggle') as HTMLSpanElement;
        const content = container.querySelector('.render-context-content') as HTMLDivElement;
        
        header.addEventListener('click', () => {
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded) {
                content.style.display = 'block';
                toggleSpan.textContent = '[−]';
            } else {
                content.style.display = 'none';
                toggleSpan.textContent = '[+]';
            }
        });
        
        return container;
    }
    
    /**
     * Update the UI with current render context values
     */
    public update(): void {
        // Update standard metrics
        this.updateElement('fps-value', `${this.context.getFps().toFixed(1)}`);
        this.updateElement('frame-value', `${this.context.getFrameCount()}`);
        this.updateElement('delta-value', `${(this.context.getDeltaTime() * 1000).toFixed(2)} ms`);
        this.updateElement('mode-value', this.context.getRenderMode());
        this.updateElement('pass-value', this.context.getRenderPass() || '-');
        
        const res = this.context.getResolution();
        this.updateElement('resolution-value', `${res.width}×${res.height}`);
        
        // Update custom metrics
        this.updateCustomMetrics();
    }
    
    /**
     * Update a specific element with a value
     */
    private updateElement(id: string, value: any): void {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toString();
        }
    }
    
    /**
     * Update custom metrics section
     */
    private updateCustomMetrics(): void {
        const customContainer = document.getElementById('custom-metrics');
        if (!customContainer) return;
        
        // For now, this is a simple implementation
        // In the future, this could be enhanced to track changes and only update when needed
        customContainer.innerHTML = '';
        
        // Add any custom metrics from the context
        const customMetrics = this.context.getCustomMetric('customMetrics');
        if (customMetrics && typeof customMetrics === 'object') {
            for (const [key, value] of Object.entries(customMetrics)) {
                const div = document.createElement('div');
                div.className = 'render-stat';
                div.innerHTML = `
                    <span class="stat-name">${key}:</span>
                    <span class="stat-value">${value}</span>
                `;
                customContainer.appendChild(div);
            }
        }
    }
}