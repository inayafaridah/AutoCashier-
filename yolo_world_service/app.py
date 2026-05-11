"""
AutoCashier AI Detection Pipeline
===================================
Multi-model pipeline for high-accuracy product detection:

  Stage 1: YOLO-World    → Zero-shot real-time object detection (bounding boxes)
  Stage 2: DINOv2        → Visual embedding similarity (identify specific product from 3-5 photos)
  Stage 3: Grounding DINO → Fallback text-guided detection if YOLO-World misses

Architecture:
  Camera Frame → YOLO-World (detect) → DINOv2 (identify) → Return product + price
                                     ↗ Grounding DINO (fallback)

Environment Variables:
  YOLO_WORLD_MODEL    : yolov8s-worldv2 | yolov8m-worldv2 | yolov8l-worldv2
  YOLO_WORLD_PORT     : Port (default: 8765)
  YOLO_WORLD_DEVICE   : cpu or cuda:0
  CONFIDENCE_THRESHOLD: Min detection confidence (default: 0.15)
  DINO_SIMILARITY_THRESHOLD: Min cosine similarity for product match (default: 0.60)
  SUPABASE_URL        : Supabase URL
  SUPABASE_KEY        : Supabase anon key

License: GPL-3.0 (following YOLO-World's license)
"""

import os
import io
import sys
import json
import time
import base64
import logging
import threading
import pickle
from pathlib import Path
from datetime import datetime

import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─── Configuration ────────────────────────────────────────────────────────────
MODEL_NAME = os.environ.get("YOLO_WORLD_MODEL", "yolov8s-worldv2")
PORT = int(os.environ.get("YOLO_WORLD_PORT", 8765))
DEVICE = os.environ.get("YOLO_WORLD_DEVICE", "cpu")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", 0.15))
DINO_SIMILARITY_THRESHOLD = float(os.environ.get("DINO_SIMILARITY_THRESHOLD", 0.60))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Paths
EMBEDDINGS_DIR = Path(__file__).parent / "product_embeddings"
EMBEDDINGS_DIR.mkdir(exist_ok=True)
EMBEDDINGS_DB_FILE = EMBEDDINGS_DIR / "embeddings_db.pkl"

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [AutoCashier-AI] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Flask App ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5000", "*"])

# ─── Global State ─────────────────────────────────────────────────────────────
yolo_model = None
dino_model = None
dino_processor = None
grounding_model = None
grounding_processor = None
current_classes = []
product_embeddings = {}  # { product_name: { "embedding": np.array, "price": float, "id": str } }
model_lock = threading.Lock()


# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_yolo_world():
    """Load YOLO-World model for zero-shot detection."""
    global yolo_model
    from ultralytics import YOLOWorld

    logger.info(f"🔷 Loading YOLO-World: {MODEL_NAME} on {DEVICE}")
    start = time.time()
    yolo_model = YOLOWorld(MODEL_NAME)
    logger.info(f"✅ YOLO-World loaded in {time.time() - start:.2f}s")

    # Set default classes from Supabase
    classes = get_default_classes()
    set_classes(classes)
    return yolo_model


def load_dinov2():
    """Load DINOv2 model for visual embedding/similarity."""
    global dino_model, dino_processor
    try:
        import torch
        from transformers import AutoImageProcessor, AutoModel

        logger.info("🔶 Loading DINOv2 (facebook/dinov2-small)...")
        start = time.time()
        dino_processor = AutoImageProcessor.from_pretrained("facebook/dinov2-small")
        dino_model = AutoModel.from_pretrained("facebook/dinov2-small")
        dino_model.eval()
        if DEVICE.startswith("cuda") and torch.cuda.is_available():
            dino_model = dino_model.to(DEVICE)
        logger.info(f"✅ DINOv2 loaded in {time.time() - start:.2f}s")

        # Load saved embeddings
        load_embeddings_db()
    except Exception as e:
        logger.warning(f"⚠️  DINOv2 not loaded (optional): {e}")
        logger.warning("   Install: pip install transformers torch")


def load_grounding_dino():
    """Load Grounding DINO as fallback detector."""
    global grounding_model, grounding_processor
    try:
        from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
        import torch

        logger.info("🔸 Loading Grounding DINO (IDEA-Research/grounding-dino-tiny)...")
        start = time.time()
        grounding_processor = AutoProcessor.from_pretrained("IDEA-Research/grounding-dino-tiny")
        grounding_model = AutoModelForZeroShotObjectDetection.from_pretrained(
            "IDEA-Research/grounding-dino-tiny"
        )
        grounding_model.eval()
        if DEVICE.startswith("cuda") and torch.cuda.is_available():
            grounding_model = grounding_model.to(DEVICE)
        logger.info(f"✅ Grounding DINO loaded in {time.time() - start:.2f}s")
    except Exception as e:
        logger.warning(f"⚠️  Grounding DINO not loaded (optional fallback): {e}")
        logger.warning("   Install: pip install transformers torch")


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_default_classes():
    """Fetch product names from Supabase, or use defaults."""
    classes = []
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            import requests
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/products?select=name,ai_label",
                headers=headers, timeout=10
            )
            if resp.status_code == 200:
                for p in resp.json():
                    label = p.get("ai_label") or p.get("name")
                    if label and label not in classes:
                        classes.append(label)
                logger.info(f"📦 Loaded {len(classes)} product classes from Supabase")
        except Exception as e:
            logger.warning(f"⚠️  Supabase fetch failed: {e}")

    if not classes:
        classes = ["bottle", "can", "box", "bag", "cup",
                   "snack", "drink", "food", "package", "container"]
        logger.info(f"📦 Using {len(classes)} default classes")
    return classes


def set_classes(classes: list):
    """Update YOLO-World's detection vocabulary."""
    global current_classes
    with model_lock:
        if yolo_model is None:
            return
        current_classes = classes
        yolo_model.set_classes(classes)
        logger.info(f"🏷️  YOLO-World classes: {classes}")


def decode_image(data: str) -> np.ndarray:
    """Decode base64 image string to BGR numpy array."""
    if "," in data:
        data = data.split(",", 1)[1]
    img_bytes = base64.b64decode(data)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def decode_image_pil(data: str) -> Image.Image:
    """Decode base64 image string to PIL Image."""
    if "," in data:
        data = data.split(",", 1)[1]
    img_bytes = base64.b64decode(data)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
#  DINOV2 EMBEDDING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def extract_embedding(pil_image: Image.Image) -> np.ndarray:
    """Extract DINOv2 embedding from a PIL image."""
    if dino_model is None or dino_processor is None:
        return None
    import torch

    inputs = dino_processor(images=pil_image, return_tensors="pt")
    if DEVICE.startswith("cuda") and torch.cuda.is_available():
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = dino_model(**inputs)

    # Use CLS token as embedding
    embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy().flatten()
    # L2 normalize
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two embeddings."""
    return float(np.dot(a, b))


def find_best_match(embedding: np.ndarray) -> tuple:
    """Find the closest product in the embeddings database."""
    if not product_embeddings or embedding is None:
        return None, 0.0

    best_name = None
    best_score = -1.0

    for name, data in product_embeddings.items():
        score = cosine_similarity(embedding, data["embedding"])
        if score > best_score:
            best_score = score
            best_name = name

    return best_name, best_score


def save_embeddings_db():
    """Save product embeddings to disk."""
    serializable = {}
    for name, data in product_embeddings.items():
        serializable[name] = {
            "embedding": data["embedding"].tolist(),
            "price": data.get("price", 0),
            "id": data.get("id", ""),
            "photo_count": data.get("photo_count", 0),
        }
    with open(EMBEDDINGS_DB_FILE, "w") as f:
        json.dump(serializable, f)
    logger.info(f"💾 Saved {len(serializable)} product embeddings to disk")


def load_embeddings_db():
    """Load product embeddings from disk."""
    global product_embeddings
    if EMBEDDINGS_DB_FILE.exists():
        try:
            with open(EMBEDDINGS_DB_FILE, "r") as f:
                raw = json.load(f)
            for name, data in raw.items():
                product_embeddings[name] = {
                    "embedding": np.array(data["embedding"], dtype=np.float32),
                    "price": data.get("price", 0),
                    "id": data.get("id", ""),
                    "photo_count": data.get("photo_count", 0),
                }
            logger.info(f"📂 Loaded {len(product_embeddings)} product embeddings from disk")
        except Exception as e:
            logger.warning(f"⚠️  Failed to load embeddings: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
#  GROUNDING DINO FALLBACK
# ═══════════════════════════════════════════════════════════════════════════════

def grounding_dino_detect(pil_image: Image.Image, text_prompt: str, conf: float = 0.25):
    """Run Grounding DINO detection as fallback."""
    if grounding_model is None or grounding_processor is None:
        return []

    import torch

    inputs = grounding_processor(images=pil_image, text=text_prompt, return_tensors="pt")
    if DEVICE.startswith("cuda") and torch.cuda.is_available():
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = grounding_model(**inputs)

    results = grounding_processor.post_process_grounded_object_detection(
        outputs,
        inputs["input_ids"],
        box_threshold=conf,
        text_threshold=conf,
        target_sizes=[pil_image.size[::-1]]
    )[0]

    detections = []
    for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
        detections.append({
            "label": label,
            "confidence": round(float(score), 4),
            "bbox": [round(float(b), 1) for b in box.tolist()],
            "source": "grounding_dino"
        })
    return detections


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "AutoCashier AI Detection Pipeline",
        "models": {
            "yolo_world": {"loaded": yolo_model is not None, "variant": MODEL_NAME},
            "dinov2": {"loaded": dino_model is not None, "products_registered": len(product_embeddings)},
            "grounding_dino": {"loaded": grounding_model is not None},
        },
        "device": DEVICE,
        "classes": current_classes,
        "status": "ready" if yolo_model is not None else "loading"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": yolo_model is not None,
        "dinov2_loaded": dino_model is not None,
        "grounding_dino_loaded": grounding_model is not None,
        "registered_products": len(product_embeddings)
    })


@app.route("/detect", methods=["POST"])
def detect():
    """
    Full AI detection pipeline.

    Request Body (JSON):
        image: base64-encoded image
        confidence: (optional) float 0-1
        use_dinov2: (optional) boolean — identify product via visual similarity
        use_fallback: (optional) boolean — try Grounding DINO if YOLO-World finds nothing
        classes: (optional) list of class names to detect

    Response (JSON):
        status: "success"
        detections: [{label, confidence, bbox, product_match, similarity, source}]
        inference_time_ms: total pipeline time
    """
    global yolo_model

    if yolo_model is None:
        load_yolo_world()

    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"status": "error", "error": "Invalid JSON"}), 400

    image_b64 = data.get("image")
    if not image_b64:
        return jsonify({"status": "error", "error": "No image provided"}), 400

    conf = float(data.get("confidence", CONFIDENCE_THRESHOLD))
    use_dinov2 = data.get("use_dinov2", True)
    use_fallback = data.get("use_fallback", True)

    # Override classes if requested
    req_classes = data.get("classes")
    if req_classes and isinstance(req_classes, list) and len(req_classes) > 0:
        set_classes(req_classes)

    try:
        img_bgr = decode_image(image_b64)
        img_pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    except Exception as e:
        return jsonify({"status": "error", "error": f"Image decode failed: {e}"}), 400

    pipeline_start = time.time()
    detections = []

    # ── Stage 1: YOLO-World ──────────────────────────────────────────────────
    yolo_start = time.time()
    with model_lock:
        results = yolo_model.predict(source=img_bgr, conf=conf, device=DEVICE, verbose=False)
    yolo_ms = (time.time() - yolo_start) * 1000

    if results and len(results) > 0:
        result = results[0]
        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                confidence = float(boxes.conf[i].item())
                bbox = boxes.xyxy[i].tolist()
                label = current_classes[cls_id] if cls_id < len(current_classes) else f"class_{cls_id}"

                det = {
                    "label": label,
                    "confidence": round(confidence, 4),
                    "bbox": [round(b, 1) for b in bbox],
                    "source": "yolo_world"
                }

                # ── Stage 2: DINOv2 identification ───────────────────────
                if use_dinov2 and dino_model is not None and len(product_embeddings) > 0:
                    x1, y1, x2, y2 = [int(b) for b in bbox]
                    h, w = img_bgr.shape[:2]
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)
                    if x2 > x1 and y2 > y1:
                        crop = img_pil.crop((x1, y1, x2, y2))
                        embedding = extract_embedding(crop)
                        if embedding is not None:
                            match_name, similarity = find_best_match(embedding)
                            if similarity >= DINO_SIMILARITY_THRESHOLD:
                                det["product_match"] = match_name
                                det["similarity"] = round(similarity, 4)
                                det["label"] = match_name  # Override with specific product
                                match_data = product_embeddings.get(match_name, {})
                                if match_data.get("price"):
                                    det["price"] = match_data["price"]
                                if match_data.get("id"):
                                    det["product_id"] = match_data["id"]

                detections.append(det)

    # ── Stage 3: Grounding DINO fallback ─────────────────────────────────────
    gdino_ms = 0
    if use_fallback and len(detections) == 0 and grounding_model is not None:
        gdino_start = time.time()
        text_prompt = ". ".join(current_classes[:20]) + "."  # Grounding DINO text format
        fallback_dets = grounding_dino_detect(img_pil, text_prompt, conf)

        for det in fallback_dets:
            # Also run DINOv2 on fallback detections
            if use_dinov2 and dino_model is not None and len(product_embeddings) > 0:
                x1, y1, x2, y2 = [int(b) for b in det["bbox"]]
                crop = img_pil.crop((max(0, x1), max(0, y1), x2, y2))
                embedding = extract_embedding(crop)
                if embedding is not None:
                    match_name, similarity = find_best_match(embedding)
                    if similarity >= DINO_SIMILARITY_THRESHOLD:
                        det["product_match"] = match_name
                        det["similarity"] = round(similarity, 4)
                        det["label"] = match_name

            detections.append(det)
        gdino_ms = (time.time() - gdino_start) * 1000

    total_ms = (time.time() - pipeline_start) * 1000

    logger.info(
        f"🔍 Detected {len(detections)} objects in {total_ms:.0f}ms "
        f"(YOLO:{yolo_ms:.0f}ms"
        + (f" GDINO:{gdino_ms:.0f}ms" if gdino_ms > 0 else "")
        + ")"
        + (f" → {', '.join(d['label'] for d in detections[:5])}" if detections else "")
    )

    return jsonify({
        "status": "success",
        "detections": detections,
        "inference_time_ms": round(total_ms, 1),
        "pipeline": {
            "yolo_world_ms": round(yolo_ms, 1),
            "grounding_dino_ms": round(gdino_ms, 1) if gdino_ms > 0 else None,
            "dinov2_used": use_dinov2 and dino_model is not None,
        },
        "model": MODEL_NAME,
        "classes_count": len(current_classes),
        "registered_products": len(product_embeddings)
    })


# ── Product Registration (DINOv2 Embeddings) ────────────────────────────────

@app.route("/register-product", methods=["POST"])
def register_product():
    """
    Register a product by providing 1-5 reference photos.
    DINOv2 extracts visual embeddings that are averaged for robust matching.

    Request Body (JSON):
        name: product name (string)
        images: list of base64-encoded photos (1-5 recommended)
        price: (optional) product price
        product_id: (optional) Supabase product UUID

    Response:
        status: "success"
        embedding_size: dimensionality
        photo_count: number of photos used
    """
    if dino_model is None:
        return jsonify({
            "status": "error",
            "error": "DINOv2 not loaded. Install: pip install transformers torch"
        }), 503

    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    images = data.get("images", [])
    price = data.get("price", 0)
    product_id = data.get("product_id", "")

    if not name:
        return jsonify({"status": "error", "error": "Product name is required"}), 400
    if not images or len(images) == 0:
        return jsonify({"status": "error", "error": "At least 1 image is required"}), 400

    # Extract and average embeddings from all photos
    embeddings = []
    for img_b64 in images[:5]:  # Max 5 photos
        try:
            pil_img = decode_image_pil(img_b64)
            emb = extract_embedding(pil_img)
            if emb is not None:
                embeddings.append(emb)
        except Exception as e:
            logger.warning(f"⚠️  Failed to process photo for {name}: {e}")

    if not embeddings:
        return jsonify({"status": "error", "error": "Could not extract embeddings from any photo"}), 400

    # Average all embeddings → single representative vector
    avg_embedding = np.mean(embeddings, axis=0)
    norm = np.linalg.norm(avg_embedding)
    if norm > 0:
        avg_embedding = avg_embedding / norm

    product_embeddings[name] = {
        "embedding": avg_embedding,
        "price": price,
        "id": product_id,
        "photo_count": len(embeddings),
    }

    save_embeddings_db()

    logger.info(f"📸 Registered product '{name}' with {len(embeddings)} photos (dim={len(avg_embedding)})")

    return jsonify({
        "status": "success",
        "product": name,
        "photo_count": len(embeddings),
        "embedding_size": len(avg_embedding),
        "total_registered": len(product_embeddings)
    })


@app.route("/registered-products", methods=["GET"])
def list_registered_products():
    """List all products with DINOv2 embeddings."""
    products = []
    for name, data in product_embeddings.items():
        products.append({
            "name": name,
            "price": data.get("price", 0),
            "id": data.get("id", ""),
            "photo_count": data.get("photo_count", 0),
        })
    return jsonify({
        "status": "success",
        "products": products,
        "total": len(products)
    })


@app.route("/unregister-product", methods=["POST"])
def unregister_product():
    """Remove a product's embeddings."""
    data = request.get_json(force=True)
    name = data.get("name", "").strip()

    if name in product_embeddings:
        del product_embeddings[name]
        save_embeddings_db()
        return jsonify({"status": "success", "message": f"Removed '{name}'"})

    return jsonify({"status": "error", "error": f"Product '{name}' not found"}), 404


# ── Class Management ─────────────────────────────────────────────────────────

@app.route("/set-classes", methods=["POST"])
def update_classes():
    data = request.get_json(force=True)
    classes = data.get("classes", [])
    if not classes or not isinstance(classes, list):
        return jsonify({"status": "error", "error": "Provide a non-empty list of classes"}), 400

    if yolo_model is None:
        load_yolo_world()
    set_classes(classes)

    return jsonify({
        "status": "success",
        "message": f"Updated to {len(classes)} classes",
        "classes": classes
    })


@app.route("/sync-supabase", methods=["POST"])
def sync_supabase():
    if yolo_model is None:
        load_yolo_world()

    classes = get_default_classes()
    if classes:
        set_classes(classes)
        return jsonify({
            "status": "success",
            "message": f"Synced {len(classes)} classes",
            "classes": classes
        })
    return jsonify({"status": "error", "error": "No classes found"}), 404


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("  AutoCashier AI Detection Pipeline")
    logger.info("  Stage 1: YOLO-World (zero-shot detection)")
    logger.info("  Stage 2: DINOv2 (visual product identification)")
    logger.info("  Stage 3: Grounding DINO (fallback)")
    logger.info(f"  Device: {DEVICE} | Port: {PORT}")
    logger.info("=" * 60)

    # Load models (YOLO-World is required, others optional)
    load_yolo_world()
    load_dinov2()
    load_grounding_dino()

    logger.info("=" * 60)
    logger.info("  🚀 All models loaded. Service ready!")
    logger.info(f"  📡 http://localhost:{PORT}")
    logger.info("=" * 60)

    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
