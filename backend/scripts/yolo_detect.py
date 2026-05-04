import sys
import json
import os
from ultralytics import YOLO

# 🔥 Load model SEKALI SAJA (global)
model_path = os.path.join(os.path.dirname(__file__), '..', 'yolov5nu.pt')
if not os.path.exists(model_path):
    model_path = 'yolov5nu.pt'

model = YOLO(model_path)

# 🔥 Threshold biar gak noise
CONF_THRESHOLD = 0.6


def detect(image_data_str):
    results_list = []
    entries = image_data_str.split(',')

    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue

        # Parse angle:path
        if ':' in entry and not entry.startswith('/') and not (len(entry) > 1 and entry[1] == ':'):
            angle, img_path = entry.split(':', 1)
        else:
            angle = 'unknown'
            img_path = entry

        img_path = img_path.strip()

        if not os.path.exists(img_path):
            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": False,
                "error": "File not found"
            })
            continue

        try:
            detections = model(img_path, verbose=False)

            objects = []

            for r in detections:
                for box in r.boxes:
                    conf = float(box.conf[0])

                    if conf < CONF_THRESHOLD:
                        continue  # 🔥 skip low confidence

                    cls_id = int(box.cls[0])
                    name = model.names[cls_id]

                    objects.append({
                        "class": name,
                        "confidence": round(conf, 4)
                    })

            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": len(objects) > 0,
                "objects": objects
            })

        except Exception as e:
            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": False,
                "error": str(e)
            })

    print(json.dumps(results_list))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        detect(sys.argv[1])
    else:
        print("[]")
