import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client for server-side operations
 * Uses service role key for full database access
 */
export function initSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabase;
}

/**
 * Initialize Supabase client for client-side operations
 * Uses anon/publishable key for limited access
 */
export function initSupabaseClientPublic() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });

  return supabase;
}

/**
 * Database operations using Supabase
 */
export const supabaseDb = {
  /**
   * Create a new book
   */
  async createBook(data: {
    title: string;
    description: string;
    genre: string;
    productionStyle: string;
    tone: string;
    userId: string;
  }) {
    const supabase = initSupabaseClient();
    const { data: book, error } = await supabase
      .from('books')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return book;
  },

  /**
   * Get book by ID
   */
  async getBook(bookId: number) {
    const supabase = initSupabaseClient();
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) throw error;
    return book;
  },

  /**
   * Update book status
   */
  async updateBookStatus(bookId: number, status: string, progress: number) {
    const supabase = initSupabaseClient();
    const { data, error } = await supabase
      .from('books')
      .update({ status, progress, updatedAt: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get World Bible for a book
   */
  async getWorldBible(bookId: number) {
    const supabase = initSupabaseClient();
    const { data: worldBibles, error } = await supabase
      .from('worldBibles')
      .select('*')
      .eq('bookId', bookId);

    if (error) throw error;
    return worldBibles;
  },

  /**
   * Upsert World Bible entry
   */
  async upsertWorldBible(data: {
    bookId: number;
    type: string;
    name: string;
    description: string;
    metadata: Record<string, any>;
  }) {
    const supabase = initSupabaseClient();
    const { data: result, error } = await supabase
      .from('worldBibles')
      .upsert([data], { onConflict: 'bookId,type,name' })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  /**
   * Create processing job
   */
  async createJob(data: {
    bookId: number;
    jobType: string;
    status: string;
    progress: number;
    metadata: Record<string, any>;
  }) {
    const supabase = initSupabaseClient();
    const { data: job, error } = await supabase
      .from('processingJobs')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return job;
  },

  /**
   * Update job status
   */
  async updateJob(jobId: number, status: string, progress: number, logs?: string[]) {
    const supabase = initSupabaseClient();
    const { data, error } = await supabase
      .from('processingJobs')
      .update({
        status,
        progress,
        logs: logs || [],
        updatedAt: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
