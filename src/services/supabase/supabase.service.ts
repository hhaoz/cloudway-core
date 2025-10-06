import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import configuration from '../../configs/configuration';
@Injectable()
export class SupabaseService {
  //setter, getter
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      configuration().database.url!,
      configuration().database.anonKey!,
    );
    console.log('Supabase init successfully');
  }

  getSupabase() {
    return this.supabase;
  }
  get supabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
