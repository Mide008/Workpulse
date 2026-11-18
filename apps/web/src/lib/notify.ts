export async function sendWorkspaceAlert(workspaceId: string, message: string) {
  // In a real production app, you'd fetch the specific workspace's webhook URLs from Supabase here.
  // For now, we will read from environment variables if they exist, or skip.
  const slackUrl = process.env.SLACK_WEBHOOK_URL
  const whatsappUrl = process.env.WHATSAPP_WEBHOOK_URL

  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })
    } catch (err) {
      console.error('Slack webhook failed:', err)
    }
  }

  if (whatsappUrl) {
    try {
      // Generic webhook for tools like Twilio/Zapier
      await fetch(whatsappUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
    } catch (err) {
      console.error('WhatsApp webhook failed:', err)
    }
  }
}