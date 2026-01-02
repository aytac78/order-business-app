import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const startTime = Date.now();
  
  let dbStatus = 'unknown';
  let dbError = null;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase.from('venues').select('id').limit(1);
    
    if (error) {
      dbStatus = 'error';
      dbError = error.message;
    } else {
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = 'error';
    dbError = String(e);
  }
  
  const responseTime = Date.now() - startTime;
  
  return Response.json({
    status: dbStatus === 'connected' ? 'online' : 'degraded',
    app: 'order-business',
    database: dbStatus,
    database_error: dbError,
    response_time: responseTime,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
