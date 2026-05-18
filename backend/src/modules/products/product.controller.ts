import { Request, Response } from 'express';
import * as productService from './product.service';
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
    const { sku, name, category, price, ai_label, stock } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!name || !price) {
      return res.status(400).json({ status: 'error', error: 'Nama dan harga produk wajib diisi.' });
    }

    // Generate unique SKU if not provided
    const finalSku = sku || `PROD-${name.substring(0, 3).toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // First, create the product in DB (without image_url yet; we need product ID for storage path)
    const result = await productService.createProduct({
      sku: finalSku,
      name,
      price: Number(price),
      category: category || null,
      ai_label: ai_label || null,
      image_url: null,
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
    if (!createdProduct?.id) {
      throw new Error('Product ID not found after creation.');
    }

    // Upload all angle images to Supabase Storage
    const ANGLE_FIELDS = [
      { field: 'imageFront', angle: 'front' },
      { field: 'imageBack',  angle: 'back'  },
      { field: 'imageLeft',  angle: 'left'  },
      { field: 'imageRight', angle: 'right' },
    ];

    const imageEntries: { angle: string; filename: string; storagePath: string; imageUrl: string }[] = [];
    let frontPublicUrl: string | null = null;

    for (const { field, angle } of ANGLE_FIELDS) {
      const file = files?.[field]?.[0];
      if (!file) continue;

      // e.g. products/uuid-123/front-originalname.jpg
      const storagePath = `products/${createdProduct.id}/${angle}-${file.originalname}`;

      const uploadResult = await productService.uploadImageToStorage(
        file.buffer,
        storagePath,
        file.mimetype
      );

      if (!uploadResult.ok || !uploadResult.url) {
        console.warn(`[createProduct] ⚠️  Failed to upload ${angle} image to storage:`, uploadResult.error);
        continue; // non-fatal: keep going with other angles
      }

      imageEntries.push({
        angle,
        filename: file.originalname,
        storagePath,
        imageUrl: uploadResult.url,
      });

      if (angle === 'front') {
        frontPublicUrl = uploadResult.url;
      }
    }

    // Update product image_url with front image's public URL
    if (frontPublicUrl) {
      await productService.updateProduct(createdProduct.id, { image_url: frontPublicUrl });
      createdProduct.image_url = frontPublicUrl;
    }

    // Save all angle metadata to product_images table
    if (imageEntries.length > 0) {
      const imgResult = await productService.insertProductImages(createdProduct.id, imageEntries);
      if (!imgResult.ok) {
        console.error('[createProduct] ❌ DATABASE ERROR (product_images):', JSON.stringify(imgResult.error, null, 2));
        return res.status(500).json({
          status: 'error',
          error: 'Gagal menyimpan metadata foto ke database.',
          details: imgResult.error
        });
      }
      console.log(`[createProduct] ✅ ${imageEntries.length} foto berhasil diupload & didaftarkan untuk produk: ${createdProduct.name}`);
    }

    // Initialize stock in all branches
    await productService.initializeProductInAllBranches(createdProduct.id, Number(price));

    return res.status(201).json({
      status: 'success',
      data: createdProduct
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

  // 1. Collect all Supabase Storage paths for this product
  const storagePaths = await productService.getProductImagePaths(id);

  // 2. Delete files from Supabase Storage
  await productService.deleteImagesFromStorage(storagePaths);

  // 3. Delete product from DB (cascades to product_images automatically)
  const result = await productService.deleteProduct(id);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error?.message || result.error });

  console.log(`[deleteProduct] ✅ Product ${id} deleted, ${storagePaths.length} file(s) removed from storage.`);
  return res.json({ status: 'success', deletedFiles: storagePaths.length });
}
