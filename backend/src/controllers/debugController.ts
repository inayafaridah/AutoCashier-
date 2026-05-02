import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export async function getSchemaController(req: Request, res: Response) {
  try {
    // Query information_schema untuk list semua tabel
    const { data, error } = await (supabase as any)
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');

    if (error) {
      return res.json({
        status: 'info',
        message: 'Supabase terhubung, tapi query schema gagal (normal untuk anon key)',
        error: error.message,
        suggestion: 'Gunakan Supabase Dashboard atau service_role untuk lihat tabel',
      });
    }

    return res.json({
      status: 'success',
      tables: data,
      total: (data || []).length,
    });
  } catch (err: any) {
    return res.json({
      status: 'error',
      message: 'Database tidak terhubung atau env vars tidak diset',
      error: err.message,
    });
  }
}

export async function getConnectionStatusController(req: Request, res: Response) {
  try {
    // Check if supabase is configured by testing a simple select
    const result: any = await (supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (result?.error?.message?.includes('not configured')) {
      return res.json({
        status: 'warning',
        connected: false,
        message: 'Supabase env vars tidak diset (.env.local)',
        hint: 'Set SUPABASE_URL dan SUPABASE_ANON_KEY di .env atau lihat Supabase Dashboard',
      });
    }

    if (result?.error) {
      return res.json({
        status: 'warning',
        connected: false,
        message: 'Supabase terhubung tapi query info_schema gagal (normal untuk anon key)',
        error: result.error.message,
        hint: 'Gunakan Supabase Dashboard untuk melihat tabel atau set SUPABASE_SERVICE_KEY untuk akses penuh',
      });
    }

    return res.json({
      status: 'success',
      connected: true,
      message: 'Database terhubung dan siap',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.json({
      status: 'error',
      connected: false,
      message: err.message || 'Unknown error',
      hint: 'Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY di .env',
    });
  }
}
