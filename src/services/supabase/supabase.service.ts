import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY'); // Sử dụng ANON_KEY thay vì SERVICE_ROLE_KEY
    
    if (!url || !key) {
      console.error('Missing Supabase credentials:', { url: !!url, key: !!key });
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
    }
    
    this.client = createClient(url, key);
    console.log('✅ Supabase client initialized successfully');
  }
}
