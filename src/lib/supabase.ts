import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://tevwgeaevbsziihpghhr.supabase.co';
const fallbackKey = 'sb_publishable_TDFYLoOQCFawbEvHYVkCdA_UT6e485x';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || fallbackUrl,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackKey
);
