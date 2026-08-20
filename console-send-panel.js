// ============================================================
// AMBROSIA TICKET PANEL - CONSOLE COMMAND
// ============================================================
// HOW TO USE:
// 1. Go to https://ambrosiaovh.vercel.app
// 2. Open Browser Developer Tools (F12)
// 3. Go to the Console tab
// 4. Paste this ENTIRE script and press Enter
// 5. The ticket panel embed will be sent to the "Open Your Own Ticket" channel
// ============================================================

(async function sendTicketPanel() {
  const PANEL_SECRET = 'ambrosia-send-panel-2026';

  console.log('%c[Ambrosia] Sending ticket panel to Discord...', 'color: #60a5fa; font-weight: bold;');

  try {
    const resp = await fetch('/api/send-ticket-panel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: PANEL_SECRET })
    });

    const data = await resp.json();

    if (resp.ok && data.success) {
      console.log('%c[Ambrosia] ✅ Ticket panel sent successfully!', 'color: #34d399; font-weight: bold;');
      console.log('%c[Ambrosia] Channel ID: ' + data.channelId, 'color: #34d399;');
      console.log('%c[Ambrosia] Message ID: ' + data.messageId, 'color: #34d399;');
      console.log('%c[Ambrosia] View it here: https://discord.com/channels/1539404742055166045/' + data.channelId, 'color: #60a5fa;');
    } else {
      console.error('%c[Aambrosia] ❌ Failed: ' + (data.error || 'Unknown error'), 'color: #f87171; font-weight: bold;');
      if (data.details) console.error('%c[Aambrosia] Details: ' + data.details, 'color: #f87171;');
    }
  } catch (e) {
    console.error('%c[Aambrosia] ❌ Network error:', 'color: #f87171; font-weight: bold;', e);
  }
})();
