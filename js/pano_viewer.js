import { app } from "../../../scripts/app.js";
import * as THREE from './lib/three.module.min.js';

class MinimalPanoViewer {
    constructor(container) {
        this.container = container;
        this.lon = 0;
        this.lat = 0;
        this.phi = 0;
        this.theta = 0;
        this.isUserInteracting = false;
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.clientWidth / window.clientHeight, 1, 1100);
        this.camera.position.set(0, 0, 0);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.clientWidth, window.clientHeight);
        container.appendChild(this.renderer.domElement);
        
        // Add controls
        container.addEventListener('mousedown', this.onMouseDown.bind(this));
        container.addEventListener('mousemove', this.onMouseMove.bind(this));
        container.addEventListener('mouseup', this.onMouseUp.bind(this));
        container.addEventListener('wheel', this.onWheel.bind(this));
        
        // Start animation
        this.animate();
        
        // Handle resize
        this.resizeView = () => {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }
    
    loadImage(dataUrl) {
        const loader = new THREE.TextureLoader();
        
        loader.load(dataUrl, (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;

            // Set the texture as the background of the scene
            this.scene.background = texture;
        });
    }
    
    onMouseDown(event) {
        this.isUserInteracting = true;
        this.onPointerDownPointerX = event.clientX;
        this.onPointerDownPointerY = event.clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;
        event.preventDefault();
    }
    
    onMouseMove(event) {
        if (this.isUserInteracting) {
            this.lon = (this.onPointerDownPointerX - event.clientX) * 0.1 + this.onPointerDownLon;
			this.lat = (this.onPointerDownPointerY - event.clientY) * 0.1 + this.onPointerDownLat;
            event.preventDefault();
        }
    }
    
    onMouseUp() {
        this.isUserInteracting = false;
    }
    
    onWheel(event) {
        const fov = this.camera.fov + event.deltaY * 0.05;
        this.camera.fov = Math.max(30, Math.min(90, fov));
        this.camera.updateProjectionMatrix();
        event.preventDefault();
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.update();
    }
    
    update() {
        this.lat = Math.max(-85, Math.min(85, this.lat));
        this.phi = THREE.MathUtils.degToRad(90 - this.lat);
        this.theta = THREE.MathUtils.degToRad(this.lon);
        
        this.camera.position.x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.position.y = 500 * Math.cos(this.phi);
        this.camera.position.z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
        
        this.camera.lookAt(this.scene.position);
        this.renderer.render(this.scene, this.camera);
    }
}

app.registerExtension({
    name: "Pano.Viewer",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "PanoramaViewerNode") {
            // Override the node's onCreate
            let originalOnCreated = nodeType.prototype.onNodeCreated
            nodeType.prototype.onNodeCreated = function() {
                let ret = originalOnCreated?.apply?.(this, arguments)
                // Create viewer container
                const container = document.createElement("div");
                container.style.backgroundColor = "#000000";
                container.style.borderRadius = "8px";
                container.style.overflow = "hidden";
                
                // Initialize the widget
                let panoramaWidget = this.addDOMWidget("panoramapreview", "preview", container, {
                    serialize: false, hideOnZoom: false
                });
                let node = this
                panoramaWidget.computeSize = function(width) {
                    let height = node.size[0] - 10;
                    this.computedHeight = height + 10;
                    return [width, height];
                }

                // Initialize viewer
                this.viewer = new MinimalPanoViewer(container);

                panoramaWidget.options.afterResize = this.viewer.resizeView
                requestAnimationFrame(this.viewer.resizeView)
                return ret
            };
            
            // Override the node's onExecute
            let originalOnExecuted = nodeType.prototype.onExecuted
            nodeType.prototype.onExecuted = function(output) {
                let ret = originalOnExecuted?.apply?.(this, arguments)
                if (output?.pano_image) {
                    this.viewer?.loadImage(output.pano_image.join(''));
                }
                return ret
            };
        }
    }
});
