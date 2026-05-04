import cv2
import time
import threading
from fastapi import FastAPI, HTTPException
from vision_backend.detector import YOLODetector
from vision_backend.database import Database

app = FastAPI(title="AutoCashier AI API")
db = Database()
detector = YOLODetector('yolov8n.pt')

# Global state for current frame and detection
current_frame = None
latest_result = {"detected": False, "label": None, "confidence": 0, "harga": 0}
fps = 0

class VideoCaptureThread(threading.Thread):
    def __init__(self, camera_id=0):
        super().__init__()
        self.cap = cv2.VideoCapture(camera_id)
        self.running = True
        self.daemon = True

    def run(self):
        global current_frame, latest_result, fps
        prev_time = 0
        
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                continue

            # FPS Calculation
            curr_time = time.time()
            fps = 1 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else 0
            prev_time = curr_time

            # Detection
            detection = detector.detect(frame)
            
            if detection:
                label = detection['label']
                conf = detection['confidence']
                bbox = detection['bbox']

                # Fetch from Database
                product = db.get_product_by_label(label)
                harga = product['harga'] if product else 0
                
                # Update latest result
                latest_result = {
                    "detected": True,
                    "label": label,
                    "confidence": round(conf, 4),
                    "harga": harga,
                    "bbox": bbox
                }

                # Visualization on frame
                x1, y1, x2, y2 = map(int, bbox)
                # Map bbox from 640x640 back to original frame size if necessary
                # For simplicity here we assume resized display or consistent aspect ratio
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                text = f"{label} {conf:.2f} - Rp{harga}"
                cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            else:
                latest_result = {"detected": False, "label": None, "confidence": 0, "harga": 0}

            # Put FPS on frame
            cv2.putText(frame, f"FPS: {fps:.2f}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            
            current_frame = frame
            
            # Display (Optional - can be disabled for headless servers)
            cv2.imshow("AutoCashier Real-time", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False
                break

    def stop(self):
        self.running = False
        self.cap.release()
        cv2.destroyAllWindows()

# Start Camera Thread
video_thread = VideoCaptureThread()
video_thread.start()

@app.get("/detect")
async def get_detection():
    return latest_result

@app.get("/produk/{label}")
async def get_product(label: str):
    product = db.get_product_by_label(label)
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan di database")
    return product

@app.get("/status")
async def get_status():
    return {"fps": round(fps, 2), "camera_running": video_thread.is_alive()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
