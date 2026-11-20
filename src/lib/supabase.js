// Shared cloud storage (Supabase). The anon key is public by design and
// restricted by row-level security to the app_state table only.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xtrbmxhfqjonuczoksew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cmJteGhmcWpvbnVjem9rc2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMDUyODMsImV4cCI6MjExMDc4MTI4M30.SfD4QHYm4-nHzFN1x5SJcCNH1t2fY_SecBWspaex_qI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
