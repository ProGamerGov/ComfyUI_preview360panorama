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
        
        // Add error handling
        loader.load(
            dataUrl, 
            (texture) => {
                console.log("Texture loaded successfully");
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.mapping = THREE.EquirectangularReflectionMapping;
                texture.minFilter = texture.magFilter = THREE.LinearFilter;

                // Set the texture as the background of the scene
                this.scene.background = texture;
            },
            undefined,
            (error) => {
                console.error("Error loading texture:", error);
            }
        );
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

// Extended viewer for video panoramas
class MinimalPanoVideoViewer extends MinimalPanoViewer {
    constructor(container) {
        super(container);
        
        // Video-specific properties
        this.frameCount = 0;
        this.fps = 30;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.lastFrameTime = 0;
        this.frames = []; // Store all frame data URLs
        this.isLoadingFrame = false; // Track if a frame is currently loading
        
        // Comment out this line to remove controls completely
        // this.createVideoControls(container);
        
        // Create a dummy controls container and elements to avoid errors
        this.controlsContainer = document.createElement("div");
        this.controlsContainer.style.display = "none";
        this.playButton = document.createElement("button");
        this.timelineSlider = document.createElement("input");
        this.frameCounter = document.createElement("span");
        
        // Add status indicator
        this.statusText = document.createElement("div");
        this.statusText.style.position = "absolute";
        this.statusText.style.top = "10px";
        this.statusText.style.left = "10px";
        this.statusText.style.color = "white";
        this.statusText.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        this.statusText.style.padding = "5px";
        this.statusText.style.borderRadius = "5px";
        this.statusText.style.fontSize = "12px";
        this.statusText.innerText = "Loading...";
        this.statusText.style.display = "none";
        container.appendChild(this.statusText);
    }
    
    createVideoControls(container) {
        // Create controls container
        this.controlsContainer = document.createElement("div");
        this.controlsContainer.style.position = "absolute";
        this.controlsContainer.style.bottom = "10px";
        this.controlsContainer.style.left = "10px";
        this.controlsContainer.style.right = "10px";
        this.controlsContainer.style.display = "flex";
        this.controlsContainer.style.alignItems = "center";
        this.controlsContainer.style.justifyContent = "center";
        this.controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        this.controlsContainer.style.padding = "5px";
        this.controlsContainer.style.borderRadius = "5px";
        container.appendChild(this.controlsContainer);
        
        // Play/Pause button
        this.playButton = document.createElement("button");
        this.playButton.innerText = "▶";
        this.playButton.style.marginRight = "5px";
        this.playButton.style.width = "30px";
        this.playButton.style.height = "30px";
        this.playButton.style.borderRadius = "15px";
        this.playButton.style.border = "none";
        this.playButton.style.background = "#444";
        this.playButton.style.color = "white";
        this.playButton.style.cursor = "pointer";
        this.playButton.addEventListener("click", this.togglePlay.bind(this));
        this.controlsContainer.appendChild(this.playButton);
        
        // Timeline slider
        this.timelineSlider = document.createElement("input");
        this.timelineSlider.type = "range";
        this.timelineSlider.min = "0";
        this.timelineSlider.max = "100";
        this.timelineSlider.value = "0";
        this.timelineSlider.style.flex = "1";
        this.timelineSlider.style.margin = "0 10px";
        this.timelineSlider.addEventListener("input", this.onTimelineChange.bind(this));
        this.controlsContainer.appendChild(this.timelineSlider);
        
        // Frame counter
        this.frameCounter = document.createElement("span");
        this.frameCounter.style.color = "white";
        this.frameCounter.style.fontSize = "12px";
        this.frameCounter.style.marginLeft = "5px";
        this.frameCounter.innerText = "0/0";
        this.controlsContainer.appendChild(this.frameCounter);
        
        // Hide controls initially
        this.controlsContainer.style.display = "none";
    }
    
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.playButton.innerText = this.isPlaying ? "⏸" : "▶";
        
        if (this.isPlaying) {
            this.lastFrameTime = performance.now();
            this.playFrames();
        }
    }
    
    onTimelineChange(event) {
        const frameIndex = Math.floor((parseInt(event.target.value) / 100) * (this.frameCount - 1));
        this.currentFrame = frameIndex;
        this.updateFrameCounter();
        // Load the frame at the current position
        this.loadCurrentFrame();
    }
    
    loadCurrentFrame() {
        if (this.isLoadingFrame) {
            console.log("Already loading a frame, skipping");
            return;
        }
        
        if (this.frames.length > 0 && this.currentFrame < this.frames.length) {
            console.log(`Loading frame ${this.currentFrame + 1}/${this.frameCount}`);
            this.statusText.innerText = `Loading frame ${this.currentFrame + 1}/${this.frameCount}`;
            this.statusText.style.display = "block";
            
            this.isLoadingFrame = true;
            
            // Use setTimeout to ensure the UI updates before loading the texture
            setTimeout(() => {
                this.loadImage(this.frames[this.currentFrame]);
                this.isLoadingFrame = false;
                
                // Hide status after a short delay
                setTimeout(() => {
                    this.statusText.style.display = "none";
                }, 500);
            }, 10);
        } else {
            console.warn(`Cannot load frame ${this.currentFrame + 1}, total frames: ${this.frames.length}`);
            this.statusText.innerText = "Error loading frame";
            this.statusText.style.display = "block";
        }
    }
    
    updateFrameCounter() {
        this.frameCounter.innerText = `${this.currentFrame + 1}/${this.frameCount}`;
        this.timelineSlider.value = ((this.currentFrame / (this.frameCount - 1)) * 100).toString();
    }
    
    playFrames() {
        if (!this.isPlaying) return;
        
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        const frameTime = 1000 / this.fps;
        
        if (elapsed >= frameTime && !this.isLoadingFrame) {
            this.lastFrameTime = now - (elapsed % frameTime);
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.updateFrameCounter();
            // Load the next frame
            this.loadCurrentFrame();
        }
        
        requestAnimationFrame(this.playFrames.bind(this));
    }
    
    setVideoData(frames, frameCount, fps) {
        console.log("Setting video data with", frames.length, "frames");
        this.frames = frames;
        this.frameCount = parseInt(frameCount);
        this.fps = parseInt(fps);
        this.currentFrame = 0;
        
        // Update UI
        this.timelineSlider.max = Math.max(1, this.frameCount - 1).toString();
        this.updateFrameCounter();
        
        // Show controls if we have valid video data
        if (this.frameCount > 1) {
            // Auto-start playback immediately
            this.isPlaying = true;
            this.playButton.innerText = "⏸";
            this.lastFrameTime = performance.now();
            this.playFrames();
            
            // Either hide controls or show them based on preference
            this.controlsContainer.style.display = "none"; // Hide controls
            // this.controlsContainer.style.display = "flex"; // Show controls
            
            // Preload the first frame immediately
            this.loadCurrentFrame();
        } else {
            console.warn("Invalid frame count:", this.frameCount);
        }
        
        // Status update
        this.statusText.innerText = `Loaded ${this.frameCount} frames at ${this.fps} FPS`;
        this.statusText.style.display = "block";
        setTimeout(() => {
            this.statusText.style.display = "none";
        }, 3000);
    }
    
    // Override the update method to handle video frames
    update() {
        super.update();
        // Additional video-specific updates would go here
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
                container.style.position = "relative"; // Add position relative for controls positioning
                
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
        else if (nodeData.name === "PanoramaVideoViewerNode") {
            // Override the node's onCreate
            let originalOnCreated = nodeType.prototype.onNodeCreated
            nodeType.prototype.onNodeCreated = function() {
                let ret = originalOnCreated?.apply?.(this, arguments)
                // Create viewer container
                const container = document.createElement("div");
                container.style.backgroundColor = "#000000";
                container.style.borderRadius = "8px";
                container.style.overflow = "hidden";
                container.style.position = "relative"; // Add position relative for controls positioning
                
                // Initialize the widget
                let panoramaWidget = this.addDOMWidget("panoramavideopreview", "preview", container, {
                    serialize: false, hideOnZoom: false
                });
                let node = this
                panoramaWidget.computeSize = function(width) {
                    let height = node.size[0] - 10;
                    this.computedHeight = height + 10;
                    return [width, height];
                }

                // Initialize video viewer
                this.viewer = new MinimalPanoVideoViewer(container);

                panoramaWidget.options.afterResize = this.viewer.resizeView
                requestAnimationFrame(this.viewer.resizeView)
                return ret
            };
            
            // Override the node's onExecute
            let originalOnExecuted = nodeType.prototype.onExecuted
            nodeType.prototype.onExecuted = function(output) {
                let ret = originalOnExecuted?.apply?.(this, arguments)
                console.log("PanoramaVideoViewerNode output:", output);
                
                if (output?.pano_video_preview) {
                    // Load the first frame preview
                    console.log("Loading preview frame");
                    this.viewer?.loadImage(output.pano_video_preview.join(''));
                    
                    // Set video data if available
                    if (output?.pano_video_frames && output?.frame_count && output?.fps) {
                        console.log("Setting video data");
                        console.log("Frame count:", output.frame_count.join(''));
                        console.log("FPS:", output.fps.join(''));
                        
                        // Check if pano_video_frames is an array
                        if (Array.isArray(output.pano_video_frames)) {
                            const frames = [];
                            console.log("Number of frames received:", output.pano_video_frames.length);
                            
                            // Process frame data URLs - handle both string and array cases
                            for (let frameData of output.pano_video_frames) {
                                if (Array.isArray(frameData)) {
                                    frames.push(frameData.join(''));
                                } else {
                                    frames.push(frameData);
                                }
                            }
                            
                            console.log("Processed frames:", frames.length, "first frame type:", typeof frames[0]);
                            
                            // Use setTimeout to ensure UI updates properly before loading frames
                            setTimeout(() => {
                                this.viewer?.setVideoData(
                                    frames,
                                    output.frame_count.join(''),
                                    output.fps.join('')
                                );
                            }, 100);
                        } else {
                            console.error("Expected array for pano_video_frames, got:", typeof output.pano_video_frames);
                        }
                    } else {
                        console.warn("No pano_video_frames found in output");
                    }
                } else {
                    console.warn("No pano_video_preview found in output");
                }
                return ret
            };
        }
    }
});
