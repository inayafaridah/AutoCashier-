import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabaseClient';
import * as productService from '../products/product.service';
import { v4 as uuidv4 } from 'uuid';

// ─── GET /api/product-requests ───────────────────────────────────────────────
// Super Admin: get all requests. Branch Admin: get only their own.
export const listRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isSuperAdmin = user.role === 'super_admin';

    let query = supabaseAdmin
      .from('product_requests')
      .select(`
        id, branch_id, name, category, price, sku, description, unit, image_url,
        status, rejection_reason, created_at, reviewed_at,
        requested_by, reviewed_by
      `)
      .order('created_at', { ascending: false });

    if (!isSuperAdmin) {
      // Branch admin only sees their own requests
      query = query.eq('branch_id', user.branch_id);
    }

    const { status } = req.query;
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ status: 'success', data: data || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── POST /api/product-requests ─────────────────────────────────────────────
// Branch Admin submits a product request for super admin approval
export const submitRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.branch_id) {
      return res.status(403).json({ status: 'error', message: 'Branch ID not found in token' });
    }

    const { name, category, price, sku, description, unit } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!name || !price) {
      return res.status(400).json({ status: 'error', message: 'Nama produk dan harga wajib diisi' });
    }

    // Generate unique ID for request
    const requestId = uuidv4();

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

      const storagePath = `requests/${requestId}/${angle}-${file.originalname}`;

      const uploadResult = await productService.uploadImageToStorage(
        file.buffer,
        storagePath,
        file.mimetype
      );

      if (!uploadResult.ok || !uploadResult.url) {
        console.warn(`[submitRequest] ⚠️ Failed to upload ${angle} image:`, uploadResult.error);
        continue;
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

    // Serialize images metadata into description
    const requestDesc = JSON.stringify({
      reason: description || '',
      images: imageEntries
    });

    const { data, error } = await supabaseAdmin
      .from('product_requests')
      .insert([{
        id: requestId,
        branch_id: user.branch_id,
        requested_by: user.sub,
        name: name.trim(),
        category: category || 'Uncategorized',
        price: Number(price),
        sku: sku || null,
        description: requestDesc,
        unit: unit || 'pcs',
        image_url: frontPublicUrl || null,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', data });
  } catch (err: any) {
    console.error('[submitRequest] error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── PATCH /api/product-requests/:id/approve ─────────────────────────────────
// Super Admin approves a product request → creates product + branch_inventory entry
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only super admin can approve
    if (user.role !== 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Only super admin can approve product requests' });
    }

    // Get the request
    const { data: reqData, error: reqErr } = await supabaseAdmin
      .from('product_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (reqErr || !reqData) {
      return res.status(404).json({ status: 'error', message: 'Request not found or already processed' });
    }

    // Allow optional price/category override from super admin body
    const finalPrice = req.body.price ? Number(req.body.price) : reqData.price;
    const finalCategory = req.body.category || reqData.category;
    const finalSku = reqData.sku || `PROD-${reqData.name.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    let reasonText = reqData.description || '';
    let imagesToRegister: any[] = [];

    try {
      if (reqData.description && reqData.description.trim().startsWith('{')) {
        const parsed = JSON.parse(reqData.description);
        reasonText = parsed.reason || '';
        imagesToRegister = parsed.images || [];
      }
    } catch (e) {
      console.warn('[approveRequest] Failed to parse request description as JSON:', e);
    }

    // 1. Create product in master products table
    const { data: productData, error: productErr } = await supabaseAdmin
      .from('products')
      .insert([{
        sku: finalSku,
        name: reqData.name,
        category: finalCategory,
        price: finalPrice,
        image_url: reqData.image_url || null,
        ai_label: reqData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
      }])
      .select()
      .single();

    if (productErr) throw productErr;

    // Register all 4 angle images in product_images linked to the new product!
    if (imagesToRegister.length > 0) {
      const productImagesPayload = imagesToRegister.map(img => ({
        angle: img.angle,
        filename: img.filename,
        storagePath: img.storagePath,
        imageUrl: img.imageUrl
      }));

      const imgResult = await productService.insertProductImages(productData.id, productImagesPayload);
      if (!imgResult.ok) {
        console.error('[approveRequest] Failed to register product_images:', imgResult.error);
      }
    }

    // 2. Link product to the requesting branch via branch_inventory
    const { error: invErr } = await supabaseAdmin
      .from('branch_inventory')
      .insert([{
        product_id: productData.id,
        branch_id: reqData.branch_id,
        stock: 0,
        cost_price: finalPrice,
        last_updated: new Date().toISOString(),
      }]);

    if (invErr) {
      // Rollback product if inventory insert fails
      await supabaseAdmin.from('products').delete().eq('id', productData.id);
      throw invErr;
    }

    // 3. Update request status to 'approved'
    await supabaseAdmin
      .from('product_requests')
      .update({
        status: 'approved',
        reviewed_by: user.sub,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    res.json({
      status: 'success',
      message: `Produk "${reqData.name}" berhasil disetujui dan ditambahkan ke katalog master`,
      data: productData,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── PATCH /api/product-requests/:id/reject ──────────────────────────────────
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role !== 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Only super admin can reject product requests' });
    }

    const { reason } = req.body;

    const { error } = await supabaseAdmin
      .from('product_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Ditolak oleh Super Admin',
        reviewed_by: user.sub,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ status: 'success', message: 'Permintaan produk telah ditolak' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── DELETE /api/product-requests/:id ────────────────────────────────────────
// Branch admin cancels their own pending request
export const cancelRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('product_requests')
      .delete()
      .eq('id', id)
      .eq('branch_id', user.branch_id)
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ status: 'success', message: 'Permintaan dibatalkan' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
