
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const express = require('express');
const cors = require('cors');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_DISCORD_BOT_TOKEN_HERE';
const GUILD_ID = process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID_HERE';
const CATEGORY_ID = process.env.TICKETS_CATEGORY_ID || ''; 
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || ''; 
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'online', bot: client.user ? client.user.tag : 'connecting' });
});

app.post('/api/webhook/order', async (req, res) => {
  try {
    const { discordTag, product, duration, price, xmrAmount, txHash, address, ticketRef } = req.body;

    if (!discordTag) {
      return res.status(400).json({ error: 'Discord username is mandatory' });
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      return res.status(500).json({ error: 'Guild not found by bot' });
    }

    const cleanUsername = discordTag.replace('@', '').toLowerCase();
    const members = await guild.members.fetch();
    const targetMember = members.find(m => 
      m.user.username.toLowerCase() === cleanUsername || 
      m.user.tag.toLowerCase() === cleanUsername
    );

    const channelName = `ticket-${ticketRef || Math.floor(1000 + Math.random() * 9000)}-${cleanUsername}`.toLowerCase();

    const permissionOverwrites = [
      {
        id: guild.id, 
        deny: [PermissionsBitField.Flags.ViewChannel]
      }
    ];

    if (STAFF_ROLE_ID) {
      permissionOverwrites.push({
        id: STAFF_ROLE_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }

    if (targetMember) {
      permissionOverwrites.push({
        id: targetMember.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID || null,
      permissionOverwrites: permissionOverwrites
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ambrosia Order Ticket #${ticketRef || 'NEW'}`)
      .setColor(0x3b82f6)
      .setDescription(`Welcome ${targetMember ? `<@${targetMember.id}>` : `**${discordTag}**`}!\n\nStaff has been notified to assist you with your license key.`)
      .addFields(
        { name: 'Product', value: `${product || 'Ambrosia Client'}`, inline: true },
        { name: 'Duration', value: `${(duration || 'Monthly').toUpperCase()}`, inline: true },
        { name: 'Price', value: `$${price || '45'} USD (~${xmrAmount || '0.26'} XMR)`, inline: true },
        { name: 'TXID / Payment Info', value: `\`${txHash || 'Pending in ticket'}\``, inline: false },
        { name: 'Official Monero (XMR) Address', value: `\`\`\`${address || 'Address provided on website'}\`\`\``, inline: false }
      )
      .setFooter({ text: 'Ambrosia.ovh Reseller System • Send XMR inside this ticket with staff' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    const pingMessage = targetMember ? `<@${targetMember.id}> ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''}` : `${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''}`;

    await ticketChannel.send({
      content: pingMessage,
      embeds: [embed],
      components: [row]
    });

    res.json({ success: true, channelId: ticketChannel.id, channelUrl: `https://discord.com/channels/${guild.id}/${ticketChannel.id}` });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: 'Closing ticket channel in 5 seconds...', ephemeral: false });
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error('Could not delete channel:', err);
      }
    }, 5000);
  }
});

client.once('ready', () => {
  console.log(`[+] Ambrosia Discord Bot logged in as ${client.user.tag}`);
  app.listen(PORT, () => {
    console.log(`[+] Webhook listener running on http://localhost:${PORT}`);
  });
});

if (BOT_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
  client.login(BOT_TOKEN);
} else {
  console.log('[!] Please set DISCORD_BOT_TOKEN in .env or config to start the Discord bot.');
}
