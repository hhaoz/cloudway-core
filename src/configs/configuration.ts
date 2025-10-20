export default () => ({
  database: {
    // Railway PostgreSQL
    url: process.env.DATABASE_URL,
    // Hoặc Supabase (nếu dùng Supabase)
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
  // queue: {},
  // cache: {},
  // logger: {}
});
