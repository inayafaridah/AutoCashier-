import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import * as productService from '../services/productService';
import { validateWithYolo } from '../services/yoloService';
import { v4 as uuidv4 } from 'uuid';

export async function listProducts(req: Request, res: Response) {
  const result = await productService.getAllProducts();
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error?.message || result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function searchProduct(req: Request, res: Response) {
  const { label } = req.query;
  if (!label) return res.status(400).json({ status: 'error', error: 'Label is required' });
  
  const result = await productService.searchProductByLabel(label as string);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  if (!result.data) return res.status(404).json({ status: 'error', error: 'Product not found' });
  
  return res.json({ status: 'success', data: result.data });
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params;
  const result = await productService.getProductById(id);
  if (!result.ok) return res.status(404).json({ status: 'error', error: result.error?.message || result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, category, basePrice, stock } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!name || !basePrice) {
      return res.status(400).json({ status: 'error', error: 'Nama dan harga produk wajib diisi.' });
    }

    // 1. Prepare image paths for YOLO validation
    const imagePaths: { angle: string; path: string }[] = [];
    if (files?.imageLeft?.[0])  imagePaths.push({ angle: 'left',  path: files.imageLeft[0].path });
    if (files?.imageRight?.[0]) imagePaths.push({ angle: 'right', path: files.imageRight[0].path });
    if (files?.imageFront?.[0]) imagePaths.push({ angle: 'front', path: files.imageFront[0].path });
    if (files?.imageBack?.[0])  imagePaths.push({ angle: 'back',  path: files.imageBack[0].path });

    if (imagePaths.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'Wajib mengunggah minimal satu foto produk untuk identifikasi AI.'
      });
    }

    // 2. Run YOLO Validation
    const yoloResult = await validateWithYolo(imagePaths);
    if (!yoloResult.ok) {
      return res.status(500).json({ status: 'error', error: 'Gagal menjalankan validasi YOLO: ' + yoloResult.error });
    }

    // Filter images where detection actually succeeded
    const detectedImages = yoloResult.results.filter(r => r.detected);
    if (detectedImages.length === 0) {
      return res.status(422).json({
        status: 'error',
        error: `AI gagal mengenali produk pada foto yang diunggah. Pastikan produk terlihat jelas dan bukan objek terlarang (seperti wajah manusia).`,
        details: yoloResult.results
      });
    }

    // 3. Get AI label from YOLO (highest confidence result from SUCCESSFUL detections)
    const bestDetection = detectedImages.reduce((best, current) =>
      (current.confidence > (best?.confidence ?? 0)) ? current : best
    );
    const aiLabel = bestDetection?.class ?? null;

    // 4. Front image as main image_url
    const frontFile = files?.imageFront?.[0];
    const imageUrl = frontFile ? `/uploads/${frontFile.filename}` : null;

    // 5. Generate unique SKU
    const sku = `PROD-${name.substring(0, 3).toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // 6. Save product to Supabase
    const result = await productService.createProduct({
      sku,
      name,
      price: Number(basePrice),
      category: category || null,
      ai_label: aiLabel,
      image_url: imageUrl,
      stock: stock !== undefined ? Number(stock) : 0,
    });

    if (!result.ok) {
      console.error('[createProduct] Supabase Error:', JSON.stringify(result.error, null, 2));
      return res.status(500).json({
        status: 'error',
        error: result.error?.message || String(result.error),
        code: result.error?.code,
      });
    }

    const createdProduct = result.data;

    // 7. Save all 3 angle photos to product_images table (MANDATORY)
    if (!createdProduct?.id) {
      throw new Error('Product ID not found after creation.');
    }

    const imageEntries: { angle: string; filename: string; storagePath: string }[] = [];
    if (files.imageLeft?.[0]) imageEntries.push({ angle: 'left', filename: files.imageLeft[0].filename, storagePath: `/uploads/${files.imageLeft[0].filename}` });
    if (files.imageRight?.[0]) imageEntries.push({ angle: 'right', filename: files.imageRight[0].filename, storagePath: `/uploads/${files.imageRight[0].filename}` });
    if (files.imageFront?.[0]) imageEntries.push({ angle: 'front', filename: files.imageFront[0].filename, storagePath: `/uploads/${files.imageFront[0].filename}` });
    if (files.imageBack?.[0]) imageEntries.push({ angle: 'back', filename: files.imageBack[0].filename, storagePath: `/uploads/${files.imageBack[0].filename}` });

    const imgResult = await productService.insertProductImages(createdProduct.id, imageEntries);
    if (!imgResult.ok) {
      console.error('[createProduct] ❌ DATABASE ERROR (product_images):', JSON.stringify(imgResult.error, null, 2));
      return res.status(500).json({
        status: 'error',
        error: 'Gagal menyimpan foto sudut pandang ke database. Cek apakah database mengizinkan sudut "back".',
        details: imgResult.error
      });
    }

    console.log(`[createProduct] ✅ ${imageEntries.length} foto berhasil didaftarkan untuk produk: ${createdProduct.name}`);
    
    // 8. Initialize in all branches (NEW: Connect to branches)
    await productService.initializeProductInAllBranches(createdProduct.id, Number(basePrice));

    return res.status(201).json({
      status: 'success',
      data: createdProduct,
      yolo: {
        message: 'Validasi YOLO berhasil!',
        ai_label: aiLabel,
        details: yoloResult.results,
      }
    });
  } catch (err: any) {
    console.error('[createProduct] Unexpected Error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

export async function updateProductController(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body;
  const result = await productService.updateProduct(id, payload);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error?.message || result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function deleteProductController(req: Request, res: Response) {
  const { id } = req.params;

  // 1. Collect all image filenames linked to this product
  const filenames = await productService.getProductImagePaths(id);

  // 2. Delete physical files from disk (skip if file not found)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  let deletedFiles = 0;
  for (const filename of filenames) {
    const filePath = path.join(uploadsDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFiles++;
        console.log(`[deleteProduct] 🗑️  Deleted file: ${filename}`);
      }
    } catch (err) {
      console.warn(`[deleteProduct] Could not delete file ${filename}:`, err);
    }
  }

  // 3. Delete product from DB (cascades to product_images automatically)
  const result = await productService.deleteProduct(id);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error?.message || result.error });

  console.log(`[deleteProduct] ✅ Product ${id} deleted, ${deletedFiles}/${filenames.length} files removed from disk`);
  return res.json({ status: 'success', deletedFiles });
}
