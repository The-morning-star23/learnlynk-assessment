import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fixed: Added ': Request' type to req
serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { application_id, task_type, due_at } = await req.json()

    // 1. Validate Input
    const validTypes = ['call', 'email', 'review']
    if (!validTypes.includes(task_type)) {
      return new Response(JSON.stringify({ error: 'Invalid task_type' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const dueDate = new Date(due_at)
    const now = new Date()
    if (isNaN(dueDate.getTime()) || dueDate <= now) {
      return new Response(JSON.stringify({ error: 'due_at must be a valid future timestamp' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Initialize Supabase Client (Service Role)
    // Fixed: Deno is available in the runtime, ignore VS Code red line if extension is missing
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Get Tenant ID
    const { data: appData, error: appError } = await supabaseAdmin
      .from('applications')
      .select('tenant_id')
      .eq('id', application_id)
      .single()

    if (appError || !appData) {
       return new Response(JSON.stringify({ error: 'Application not found' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Insert Task
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        application_id,
        tenant_id: appData.tenant_id,
        type: task_type,
        due_at: due_at,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, task_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error: any) { // Fixed: Added ': any' to handle the unknown error type
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})