import os
import io
import json
from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import numpy as np

app = FastAPI(title="AutoCashier Detection Service")

# 🔥 Global Model Loading (Loaded only once)
model_path = os.path.join(os.path.dirname(__file__), '..', 'yolov8n.pt')
if not os.path.exists(model_path):
    model_path = 'yolov8n.pt'

print(f"[YOLO API] Loading model from {model_path}...")
model = YOLO(model_path)
print("[YOLO API] Model loaded and ready.")

CONF_THRESHOLD = 0.5

@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    try:
        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(img)

        # Run inference
        results = model(img_np, verbose=False)
        
        objects = []
        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf >= CONF_THRESHOLD:
                    cls_id = int(box.cls[0])
                    name = model.names[cls_id]
                    xyxy = box.xyxy[0].tolist()
                    
                    objects.append({
                        "class": name,
                        "confidence": round(conf, 4),
                        "bbox": xyxy
                    })

        # Find top result for backward compatibility
        top_result = {"class": None, "confidence": 0}
        if objects:
            top = max(objects, key=lambda x: x['confidence'])
            top_result = {"class": top['class'], "confidence": top['confidence']}

        return {
            "status": "success",
            "detected": len(objects) > 0,
            "class": top_result['class'],
            "confidence": top_result['confidence'],
            "all_detections": objects,
            "objects": objects # For new structure support
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
