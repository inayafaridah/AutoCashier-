import cv2
import json
import time
import torch
from .model_loader import loader
from .utils import DetectionStabilizer, get_product_price, is_valid_product

class ProductScanner:
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.stabilizer = DetectionStabilizer(window_size=8, stability_threshold=5)
        self.model = loader.model

    def run(self):
        """
        Main loop for real-time detection.
        Captures from webcam, applies ROI, runs YOLO, and prints JSON output.
        """
        cap = cv2.VideoCapture(self.camera_index)
        
        if not cap.isOpened():
            print(json.dumps({"error": "Could not open camera"}))
            return

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # 1. REGION OF INTEREST (ROI) - Middle 50%
                h, w, _ = frame.shape
                roi_h, roi_w = int(h * 0.5), int(w * 0.5)
                y1, x1 = int((h - roi_h) / 2), int((w - roi_w) / 2)
                roi_frame = frame[y1:y1+roi_h, x1:x1+roi_w]

                # 2. PRE-PROCESSING
                input_frame = cv2.resize(roi_frame, (640, 640))

                # 3. DETECTION
                half_precision = torch.cuda.is_available()
                results = self.model.predict(
                    source=input_frame,
                    imgsz=640,
                    conf=0.5,
                    iou=0.5,
                    verbose=False,
                    half=half_precision
                )

                # 4. PROCESS DETECTIONS (GET ALL OBJECTS FOR DETAIL)
                best_product = None
                best_conf = 0.0
                all_objects = []
                
                if results and len(results[0].boxes) > 0:
                    boxes = results[0].boxes
                    for box in boxes:
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        name = self.model.names[cls_id]
                        
                        obj_data = {"label": name, "confidence": round(conf, 2)}
                        all_objects.append(obj_data)

                        # Check if this is a valid product for mapping
                        if is_valid_product(name) and conf > best_conf:
                            best_conf = conf
                            best_product = name

                # 5. STABILITY (ANTI-FLICKER)
                self.stabilizer.add_detection(best_product if best_product else "background")
                stable_product = self.stabilizer.get_stable_result()

                # 6. JSON OUTPUT (DETAIL + MATCH)
                price = get_product_price(stable_product) if stable_product else None
                
                output = {
                    "detected": price is not None,
                    "product_name": stable_product if price is not None else None,
                    "confidence": round(best_conf, 2) if price is not None else 0.0,
                    "price": price,
                    "all_objects": all_objects # Detailed view of everything in frame
                }
                print(json.dumps(output))

                # Performance Target: ~30 FPS (avoid heavy processing here)
                # To see the feed locally (debugging only):
                # cv2.imshow('JAGOAI VISION ROI', roi_frame)
                # if cv2.waitKey(1) & 0xFF == ord('q'): break

        finally:
            cap.release()
            cv2.destroyAllWindows()

if __name__ == "__main__":
    # If run directly, start scanning
    scanner = ProductScanner()
    scanner.run()
