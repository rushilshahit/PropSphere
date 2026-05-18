import { supabase } from '@/lib/supabase';

export const mediaService = {
  async upload(file: File, bucket: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  },
};
