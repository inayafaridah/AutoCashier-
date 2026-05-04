import cv2
import threading
from ultralytics import YOLO

class YOLODetector:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, model_path='yolov8n.pt'):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(YOLODetector, cls).__new__(cls)
                cls._instance.model = YOLO(model_path)
        return cls._instance

    def detect(self, frame, conf_threshold=0.6):
        # Resize frame to 640x640 for consistency
        img = cv2.resize(frame, (640, 640))
        results = self.model(img, stream=True, verbose=False)
        
        detections = []
        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf >= conf_threshold:
                    cls_id = int(box.cls[0])
                    label = self.model.names[cls_id]
                    # Get bounding box [x1, y1, x2, y2]
                    # Note: These are relative to 640x640, we need to map back to original frame if needed
                    xyxy = box.xyxy[0].tolist()
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "bbox": xyxy
                    })
        
        # Filter for highest confidence detection if multiple objects found
        if detections:
            return max(detections, key=lambda x: x['confidence'])
        
        return None
