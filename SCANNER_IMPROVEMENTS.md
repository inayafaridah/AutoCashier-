# Product Scanner Improvement Plan

## Problem Identified
The Product Scanner was misidentifying products. For example: scanning a **Tel U water bottle** was incorrectly identified as **Cimory Yogurt** (93% confidence).

## Root Cause
The system uses **YOLOv8n** (a general-purpose object detector trained on COCO dataset), which:
- Cannot distinguish between specific brands
- Detects generic objects (bottle, beverage, container) not product-specific identities
- Returns low-accuracy results for retail product identification

## Solutions Implemented

### 1. **Confidence Thresholds** ✅
Added confidence-based matching logic:
- **Minimum threshold (50%)**: Won't attempt matching below this
- **Fuzzy match threshold (70%)**: Only allows fuzzy matching if confidence ≥ 70%
- **Exact match**: Always tries exact `ai_label` match first

**File**: `backend/src/controllers/detectionController.ts:scanAndMatch()`

### 2. **Improved Frontend Feedback** ✅
Updated scanner UI to show:
- Confidence percentage in the unregistered product message
- Better error guidance:
  - If confidence < 60%: "Deteksi kurang akurat. Pastikan produk jelas dan pencahayaan cukup." (Ensure clear, well-lit product images)
  - If confidence ≥ 60%: "Produk tidak ditemukan di Master Products" (Product not in catalog)

**File**: `src/pages/ProductScannerPage.tsx`

---

## Recommendations for Further Improvement

### Option A: Train Custom YOLO Model (Best Long-Term)
```bash
# Collect 100-300 images per product
# Label with YOLO format
# Train with:
yolo detect train data=data.yaml model=yolov8n.pt epochs=100
```
**Pros**: High accuracy for your specific products  
**Cons**: Requires dataset collection & training time

### Option B: Add Image Similarity Matching
- Store product image embeddings using ResNet/CLIP
- Compare incoming scan against product database images
- Better than generic object detection

### Option C: Improve AI Label Strategy
When creating products, set `ai_label` to:
- Product category + descriptor (e.g., "water bottle clear", "yogurt plain")
- Not just generic names

### Option D: Manual Product Verification Flow
1. Scan product
2. If confidence < 70%, show top 3 matching products
3. Let user select correct product or add new one

---

## Testing Checklist

- [ ] Test with well-lit, clear product images
- [ ] Verify low-confidence products show helpful guidance
- [ ] Check that fuzzy matching only activates for confidence ≥ 70%
- [ ] Confirm exact matches work when `ai_label` is set correctly

## Next Steps

1. **Add debug logging** to scanner to track detection patterns
2. **Collect misidentification data** to understand failure cases
3. **Consider Option B** (image similarity) as quick win
4. **Plan Option A** (custom YOLO) for production accuracy
