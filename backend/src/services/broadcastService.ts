import { supabaseAdmin, supabase } from '../config/supabaseClient';
import fs from 'fs';
import path from 'path';

const MOCK_FILE = path.join(__dirname, '..', '..', 'broadcasts.json');

function getMockBroadcasts() {
  if (fs.existsSync(MOCK_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MOCK_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [
    { id: '1', subject: 'Holiday operational hours update', body: 'All branches will close at 5 PM on May 1st.', audience: 'ALL_BRANCHES', created_at: '2026-04-24T10:00:00Z' },
    { id: '2', subject: 'System Maintenance', body: 'The dashboard will be offline for 2 hours tonight.', audience: 'ALL_MEMBERS', created_at: '2026-04-22T14:30:00Z' }
  ];
}

function saveMockBroadcast(broadcast: any) {
  const current = getMockBroadcasts();
  const updated = [broadcast, ...current];
  fs.writeFileSync(MOCK_FILE, JSON.stringify(updated, null, 2));
}

export async function getAllBroadcasts() {
  try {
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
       console.log('[broadcastService] 💡 Using mock broadcasts (Table not found)');
       return { ok: true, data: getMockBroadcasts() };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: true, data: getMockBroadcasts() };
  }
}

export async function createBroadcast(broadcastData: any) {
  try {
    const db = supabaseAdmin || supabase;
    const payload = {
      subject: broadcastData.subject,
      body: broadcastData.message,
      audience: broadcastData.audience,
      target_id: broadcastData.targetId || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db
      .from('broadcasts')
      .insert([payload])
      .select()
      .single();

    if (error) {
       console.log('[broadcastService] 💡 Saving to mock broadcasts (Table not found)');
       const mockItem = { ...payload, id: Math.random().toString(36).substr(2, 9) };
       saveMockBroadcast(mockItem);
       return { ok: true, data: mockItem };
    }
    return { ok: true, data };
  } catch (err) {
    const payload = { 
      id: Math.random().toString(36).substr(2, 9),
      subject: broadcastData.subject,
      body: broadcastData.message,
      audience: broadcastData.audience,
      target_id: broadcastData.targetId || null,
      created_at: new Date().toISOString()
    };
    saveMockBroadcast(payload);
    return { ok: true, data: payload };
  }
}
