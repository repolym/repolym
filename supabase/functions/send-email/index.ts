import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'noreply@repolym.com'

serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    try {
        const { to, subject, html } = await req.json()
        if (!to || !subject || !html) throw new Error('Missing fields')
        if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to,
                subject,
                html,
            }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Email send failed')
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})