import base64
from io import BytesIO
from typing import Dict

import numpy as np
import torch
from PIL import Image


class PanoramaViewerNode:
    """A ComfyUI node that provides an interactive 360-degree panorama viewer for
    equirectangular images.

    This node takes an input image tensor and displays it in a Three.js-based
    panoramic viewer that allows users to:
    - Pan around the 360-degree view using mouse drag
    - Zoom in/out using the mouse wheel
    - View the panorama with proper equirectangular projection

    The viewer automatically handles different image formats and sizes, including:
    - Batch processing (takes first image from batch)
    - Grayscale to RGB conversion
    - Image resizing for performance optimization
    - Float to uint8 conversion
    """

    @classmethod
    def INPUT_TYPES(cls):
        """Define the input parameters for the node.

        Returns:
            dict: Dictionary containing required input parameters:
                - images (torch.Tensor): Input tensor containing the panoramic image.
                - max_width (int): Maximum width for resizing. Default: 4096.
                  Set to -1 for no resizing. Supports 2:1 and 1:1 aspect ratios.
        """
        return {
            "required": {
                "images": ("IMAGE",),
                "max_width": (
                    "INT",
                    {
                        "default": 4096,
                        "tooltip": "The max width to use. Images larger than the"
                        + " specified value will be resized. Larger sizes may run"
                        + " slower. Set to -1 for no resizing. Currently only 2:1"
                        + " and 1:1 aspect ratios are supported for resizing.",
                    },
                ),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "view_pano"
    OUTPUT_NODE = True
    CATEGORY = "pytorch360convert"

    def __init__(self) -> None:
        self.type = "pano"

    def view_pano(
        self, images: torch.Tensor, max_width: int = 4096
    ) -> Dict[str, Dict[str, str]]:
        """Process and display the panoramic image in the viewer.

        This method handles the conversion of the input tensor to a viewable format by:
        1. Extracting the first image if dealing with a batch
        2. Converting the tensor to a numpy array
        3. Converting float values to uint8 if necessary
        4. Converting grayscale to RGB if necessary
        5. Resizing the image if it exceeds max_width
        6. Converting the processed image to a base64-encoded PNG

        Args:
            images (torch.Tensor): Input tensor containing the panoramic image(s).
                Should be in format (B, H, W, C) or (H, W, C).
            max_width (int, optional): Maximum width for resizing. Images will not
                resized if they are smaller than the specified size. Set to -1 to
                disable resizing. Default: 4096

        Returns:
            Dict[str, Dict[str, str]]: Dictionary containing the UI update information
                with the base64-encoded PNG image data.
        """
        # Handle batch dimension
        if len(images.shape) == 4:
            image = images[0]
        else:
            image = images

        # Convert to numpy and proper format
        image_np = image.cpu().numpy()

        # Convert to uint8 if needed
        if image_np.dtype != np.uint8:
            image_np = (image_np * 255).astype(np.uint8)

        # Handle grayscale images
        if len(image_np.shape) == 2 or image_np.shape[2] == 1:
            image_np = np.repeat(image_np[..., np.newaxis], 3, axis=2)

        # Convert to PIL Image
        pil_image = Image.fromarray(image_np)

        # Optionally resize image
        if max_width > 0 and pil_image.size[0] > max_width:
            if pil_image.size[0] == pil_image.size[1]:
                new_size = (max_width, max_width)
            else:
                new_size = (max_width, max_width // 2)
            pil_image = pil_image.resize(new_size, resample=Image.Resampling.LANCZOS)

        # Save to BytesIO
        buffered = BytesIO()
        pil_image.save(buffered, format="PNG")

        # Get base64 string
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return {"ui": {"pano_image": f"data:image/png;base64,{img_str}"}}


NODE_CLASS_MAPPINGS = {"PanoramaViewerNode": PanoramaViewerNode}

NODE_DISPLAY_NAME_MAPPINGS = {"PanoramaViewerNode": "Preview 360 Panorama"}
