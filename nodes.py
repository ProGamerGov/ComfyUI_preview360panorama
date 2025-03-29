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
                - max_width (int): Maximum dimension for resizing. Default: 4096
                  Set to -1 for no resizing.
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
                        + " slower. Set to -1 for no resizing.",
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
        if max_width > 0 and (
            pil_image.size[0] > max_width or pil_image.size[1] > max_width
        ):
            new_size = tuple(
                [int(max_width * x / max(pil_image.size)) for x in pil_image.size]
            )
            pil_image = pil_image.resize(new_size, resample=Image.Resampling.LANCZOS)  # type: ignore[arg-type]

        # Save to BytesIO
        buffered = BytesIO()
        pil_image.save(buffered, format="PNG")

        # Get base64 string
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return {"ui": {"pano_image": f"data:image/png;base64,{img_str}"}}

class PanoramaVideoViewerNode:
    """A ComfyUI node that provides an interactive 360-degree panorama viewer for
    equirectangular video content.

    This node takes a video file path or a sequence of image frames and displays it in 
    a Three.js-based panoramic video viewer that allows users to:
    - Pan around the 360-degree view using mouse drag
    - Zoom in/out using the mouse wheel
    - Play, pause, and scrub through the video timeline
    - View the panorama video with proper equirectangular projection

    The viewer automatically handles different video formats and sizes, including:
    - Batch processing (takes frames from batch)
    - Proper frame sequencing and timing
    - Image resizing for performance optimization
    - Float to uint8 conversion
    """

    @classmethod
    def INPUT_TYPES(cls):
        """Define the input parameters for the node.

        Returns:
            dict: Dictionary containing required input parameters:
                - video_frames (torch.Tensor): Input tensor containing a batch of video frames.
                - fps (int): Frames per second for the video playback.
                - max_width (int): Maximum dimension for resizing. Default: 2048
                  Set to -1 for no resizing.
        """
        return {
            "required": {
                "video_frames": ("IMAGE",),
                "fps": (
                    "INT", 
                    {
                        "default": 30,
                        "min": 1,
                        "max": 120,
                        "step": 1,
                        "tooltip": "Frames per second for video playback"
                    }
                ),
                "max_width": (
                    "INT",
                    {
                        "default": 2048,
                        "tooltip": "The max width to use. Frames larger than the"
                        + " specified value will be resized. Larger sizes may run"
                        + " slower. Set to -1 for no resizing.",
                    },
                ),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "view_video_pano"
    OUTPUT_NODE = True
    CATEGORY = "pytorch360convert"

    def __init__(self) -> None:
        self.type = "video_pano"

    def view_video_pano(
        self, video_frames: torch.Tensor, fps: int = 30, max_width: int = 2048
    ) -> Dict[str, Dict[str, str]]:
        """Process and display the panoramic video in the viewer.

        This method handles the conversion of the input tensor frames to a viewable video format by:
        1. Processing each frame in the batch
        2. Converting each tensor to a numpy array
        3. Converting float values to uint8 if necessary
        4. Converting grayscale to RGB if necessary
        5. Resizing the frames if they exceed max_width
        6. Creating a base64-encoded video from the frames

        Args:
            video_frames (torch.Tensor): Input tensor containing the panoramic video frames.
                Should be in format (B, H, W, C).
            fps (int, optional): Frames per second for video playback. Default: 30
            max_width (int, optional): Maximum width for resizing. Frames will not be
                resized if they are smaller than the specified size. Set to -1 to
                disable resizing. Default: 2048

        Returns:
            Dict[str, Dict[str, str]]: Dictionary containing the UI update information
                with the base64-encoded video data and playback parameters.
        """
        # Ensure we have batch dimension
        if len(video_frames.shape) != 4:
            raise ValueError("Expected video frames in batch format (B, H, W, C)")

        # Create a list to store processed frames
        processed_frames = []
        
        # Process each frame
        for frame in video_frames:
            # Convert to numpy and proper format
            frame_np = frame.cpu().numpy()

            # Convert to uint8 if needed
            if frame_np.dtype != np.uint8:
                frame_np = (frame_np * 255).astype(np.uint8)

            # Handle grayscale images
            if len(frame_np.shape) == 2 or frame_np.shape[2] == 1:
                frame_np = np.repeat(frame_np[..., np.newaxis], 3, axis=2)

            # Convert to PIL Image
            pil_frame = Image.fromarray(frame_np)

            # Optionally resize image
            if max_width > 0 and (
                pil_frame.size[0] > max_width or pil_frame.size[1] > max_width
            ):
                new_size = tuple(
                    [int(max_width * x / max(pil_frame.size)) for x in pil_frame.size]
                )
                pil_frame = pil_frame.resize(new_size, resample=Image.Resampling.LANCZOS)

            # Add to processed frames
            processed_frames.append(pil_frame)
        
        # Check if we have any frames
        if not processed_frames:
            return {"ui": {"error": "No frames found in input"}}
        
        # Create a list to store base64 strings of each frame
        frame_data = []
        
        # Convert each frame to base64
        for frame in processed_frames:
            buffered = BytesIO()
            frame.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            frame_data.append(f"data:image/png;base64,{img_str}")
        
        # Return the frame data, count, and fps
        return {
            "ui": {
                "pano_video_preview": frame_data[0],  # First frame as preview
                "pano_video_frames": frame_data,      # All frames as list of strings
                "frame_count": str(len(processed_frames)),
                "fps": str(fps),
                "video_type": "360_equirectangular"
            }
        }

# Update mappings to include the new node
NODE_CLASS_MAPPINGS = {
    "PanoramaViewerNode": PanoramaViewerNode,
    "PanoramaVideoViewerNode": PanoramaVideoViewerNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PanoramaViewerNode": "Preview 360 Panorama",
    "PanoramaVideoViewerNode": "Preview 360 Video Panorama"
}
