import os
import urllib.request

# URLs of the JavaScript files to be downloaded
js_files = [
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.172.0/three.core.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.172.0/three.module.min.js",
]

# Get the directory where this script is located
extension_path = os.path.dirname(__file__)

# Set the path where the files should be saved (path/to/custom_nodes/ComfyUI_preview360panorama/js/lib/)
js_lib_path = os.path.join(extension_path, "js", "lib")

# Create the "js/lib" directory if it does not exist
if not os.path.exists(js_lib_path):
    os.makedirs(js_lib_path)

# Download and save each JavaScript file
for url in js_files:
    file_name = os.path.basename(url)
    file_path = os.path.join(js_lib_path, file_name)

    urllib.request.urlretrieve(url, file_path)
