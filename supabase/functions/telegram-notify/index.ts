import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { telegram_id, status } = await req.json()
    const botToken = Deno.env.get('BOT_TOKEN')
    if (!botToken) throw new Error("BOT_TOKEN is not set")

    let text = ''
    let reply_markup = undefined

    if (status === 'approved') {
      text = "🎉 **Вашу заявку схвалено!**\n\nТепер ви маєте повний доступ до платформи."
      reply_markup = {
        inline_keyboard: [[
          { text: "🚀 Відкрити платформу", web_app: { url: "https://hackademia-web.vercel.app" } }
        ]]
      }
    } else if (status === 'rejected') {
      text = "❌ **Ваш доступ до платформи скасовано.**\n\nЩоб відновити доступ, придбайте новий курс або лекцію. Після оплати відкрийте платформу та натисніть кнопку відправки повторного запиту."
      reply_markup = {
        inline_keyboard: [[
          { text: "🚀 Відкрити платформу", web_app: { url: "https://hackademia-web.vercel.app" } }
        ]]
      }
    } else {
      throw new Error("Invalid status")
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegram_id, text: text, parse_mode: 'Markdown', reply_markup: reply_markup })
    })

    const result = await telegramResponse.json()
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})