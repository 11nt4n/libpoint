'use server';

import { supabase } from '@/lib/supabase';
import { encrypt, decrypt } from '@/lib/encryption';

export async function createEncryptedProfile(data: any) {
  const encryptedData = {
    ...data,
    nama_lengkap: encrypt(data.nama_lengkap),
    npm: encrypt(data.npm),
  };

  const { data: result, error } = await supabase.from('profiles').insert(encryptedData).select().single();
  
  if (error) return { error: error.message };
  
  return {
    data: {
      ...result,
      nama_lengkap: decrypt(result.nama_lengkap),
      npm: decrypt(result.npm),
    }
  };
}

export async function getEncryptedProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  
  if (error || !data) return { error: error?.message || 'Profile not found' };
  
  return {
    data: {
      ...data,
      nama_lengkap: decrypt(data.nama_lengkap),
      npm: decrypt(data.npm),
    }
  };
}

export async function getAllEncryptedProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  
  if (error || !data) return { error: error?.message || 'Failed to fetch profiles', data: [] };
  
  return {
    data: data.map(p => ({
      ...p,
      nama_lengkap: decrypt(p.nama_lengkap),
      npm: decrypt(p.npm),
    }))
  };
}

export async function addPointsByNpm(npm: string, points: number) {
  const profilesResult = await getAllEncryptedProfiles();
  if (profilesResult.error) return { error: profilesResult.error };
  
  const user = profilesResult.data.find(p => p.npm === npm);
  if (!user) return { error: 'Mahasiswa dengan NPM tersebut tidak ditemukan.' };
  
  const newTotal = (user.total_points || 0) + points;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ total_points: newTotal })
    .eq('id', user.id); // Safe because ID is not encrypted
    
  if (updateError) return { error: updateError.message };
  
  return {
    data: {
      ...user,
      total_points: newTotal
    }
  };
}
