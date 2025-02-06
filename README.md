# 🌎 360° Panorama Image Viewer for ComfyUI

A custom [ComfyUI](https://github.com/comfyanonymous/ComfyUI) node for interactive 360° panorama image previews. Easily inspect equirectangular projections in their proper spherical form to verify seams and distortions.

## ✨ Features
- Interactive 360° panorama viewer
- Adjustable resolution settings
- Intuitive mouse controls

## 🎮 Usage

Once installed, the viewer node is available as "Preview 360 Panorama" under the 'pytorch360convert' category.

<video src="https://github.com/user-attachments/assets/7b6a6957-3dfa-4bd9-9a81-1861fcd23cc7"></video>

### Basic Setup
1. Add the "Preview 360 Panorama" node to your workflow
2. Connect an equirectangular image to the node's input
3. Run your workflow to view the image

### Controls
- **Pan View**: Left-click and drag to look around
- **Zoom**: Use the mouse scroll wheel
- **Resolution**: Set `max_width` to `-1` for full resolution (may increase load times)


## 📦 Installation

### Quick Install Options

1. **ComfyUI Manager (Recommended)**
   - If you have [ComfyUI-Manager](https://github.com/ltdrdata/ComfyUI-Manager) installed:
     - Either paste this repo's GitHub URL
     - Or find it in the built-in install menu

2. **ComfyUI Registry**

Using [comfy-cli](https://github.com/Comfy-Org/comfy-cli), you can download this project from the [comfy registry](https://registry.comfy.org/), like this:

   ```bash
   comfy node registry-install comfyui-preview360panorama
   ```

### Manual Installation

#### Option 1: Using Git
1. Install Git ([Windows download](https://git-scm.com/download/win)) if you have not done so already
2. Navigate to your ComfyUI's `custom_nodes` directory
4. Clone the repository:
   ```bash
   git clone https://github.com/ProGamerGov/ComfyUI_preview360panorama --recursive
   ```
5. Run the installer:
   ```bash
   python ComfyUI_preview360panorama/install.py
   ```

#### Option 2: Direct Download
1. Download this repository as a ZIP file
2. Extract it to your ComfyUI's `custom_nodes` directory
3. Download required Three.js files from [cdnjs](https://cdnjs.com/libraries/three.js) or [mrdoob/three.js](https://github.com/mrdoob/three.js/):
   - `three.core.min.js`
   - `three.module.min.js`
4. Place both files in: `custom_nodes/ComfyUI_preview360panorama/js/lib`

### Directory Structure

The project directory should look like this if installation was successful.

```
custom_nodes/
└── ComfyUI_preview360panorama/
    ├── __init__.py
    ├── js/
    │   ├── pano_viewer.js
    │   └── lib/
    │       ├── three.core.min.js
    │       └── three.module.min.js
    └── nodes.py
```

Need more help? Check out the [detailed guide](https://www.comflowy.com/advanced/how-to-install-comfyui-extension) on installing ComfyUI extensions.


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 🔬 Citation

If you use this library in your research or project, please refer to the included [CITATION.cff](CITATION.cff) file or cite it as follows:

### BibTeX
```bibtex
@misc{egan2025preview360panorama,
  title={Preview 360 Panorama},
  author={Egan, Ben},
  year={2025},
  publisher={GitHub},
  howpublished={\url{https://github.com/ProGamerGov/ComfyUI_preview360panorama}}
}
```

### APA Style
```
Egan, B. (2025). Preview 360 Panorama [Computer software]. GitHub. https://github.com/ProGamerGov/ComfyUI_preview360panorama
```

## 🌐 Related

For editing 360 images inside ComfyUI, see the [ComfyUI_pytorch360convert](https://github.com/ProGamerGov/ComfyUI_pytorch360convert) custom nodes.
