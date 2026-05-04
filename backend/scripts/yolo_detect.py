import sys
import json
import os

def detect(image_data_str):
    """
    image_data_str format: "angle1:path1,angle2:path2,angle3:path3"
    or legacy format: "path1,path2,path3" (no angle prefix)
    """
    try:
        from ultralytics import YOLO
        # Load model (already downloaded to local dir)
        model_path = os.path.join(os.path.dirname(__file__), '..', 'yolov8n.pt')
        if not os.path.exists(model_path):
            model_path = 'yolov8n.pt'
        model = YOLO(model_path)
    except ImportError:
        sys.exit(1)

    results_list = []
    entries = image_data_str.split(',')

    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue

        # Support "angle:path" format
        if ':' in entry and not entry.startswith('/') and not (len(entry) > 1 and entry[1] == ':'):
            parts = entry.split(':', 1)
            angle = parts[0]
            img_path = parts[1]
        else:
            # Legacy: no angle prefix
            angle = 'unknown'
            img_path = entry

        img_path = img_path.strip()
        if not img_path or not os.path.exists(img_path):
            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": False,
                "confidence": 0.0,
                "class": None,
                "error": "File not found"
            })
            continue

        try:
            # Classes that should NEVER be used as a primary product label
            BLACKLIST = {
                'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 
                'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign', 
                'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 
                'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 
                'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 
                'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 
                'surfboard', 'tennis racket', 'chair', 'couch', 'potted plant', 'bed', 
                'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 
                'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 
                'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 
                'hair drier', 'toothbrush'
            }

            detections = model(img_path, verbose=False)

            detected = False
            max_conf = 0.0
            cls_name = None
            all_boxes = []

            for r in detections:
                if len(r.boxes) > 0:
                    for i, box in enumerate(r.boxes):
                        conf = float(box.conf[0])
                        name = model.names[int(box.cls[0])]
                        all_boxes.append({"class": name, "confidence": round(conf, 4)})
                        
                        # Only consider non-blacklisted items as the "Product"
                        if name not in BLACKLIST and conf > max_conf:
                            detected = True
                            max_conf = conf
                            cls_name = name

            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": detected,
                "confidence": round(max_conf, 4),
                "class": cls_name,
                "all_detections": all_boxes
            })
        except Exception as e:
            results_list.append({
                "angle": angle,
                "path": img_path,
                "detected": False,
                "confidence": 0.0,
                "class": None,
                "error": str(e)
            })

    print(json.dumps(results_list))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        detect(sys.argv[1])
    else:
        print("[]")
