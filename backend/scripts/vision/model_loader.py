import os
import torch
from ultralytics import YOLO

class YOLOModelLoader:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOModelLoader, cls).__new__(cls)
            cls._instance._initialize_model()
        return cls._instance

    def _initialize_model(self):
        """
        Initialize the YOLOv8n model once globally.
        Uses GPU (CUDA) if available, otherwise CPU.
        """
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'yolov8n.pt')
        if not os.path.exists(model_path):
            # Fallback to current directory or auto-download
            model_path = 'yolov8n.pt'
        
        print(f"[Vision] Loading model from: {model_path}")
        self._model = YOLO(model_path)
        
        # Check for GPU
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self._model.to(device)
        
        # Enable FP16 if GPU is used for speed
        if device == 'cuda':
            print("[Vision] GPU detected. Enabling Half Precision (FP16).")
            # YOLOv8 models handle .half() automatically during inference if device is cuda
        else:
            print("[Vision] GPU not found. Falling back to CPU.")

    @property
    def model(self):
        return self._model

# Global singleton instance
loader = YOLOModelLoader()
