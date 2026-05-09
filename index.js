const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
  ]
});

// إعدادات السيرفر
const settings = new Map();
const actions = new Map();

// ================== حماية نك ==================
function addAction(userId) {
  const now = Date.now();
  const data = actions.get(userId) || { count: 0, time: now };

  if (now - data.time > 10000) {
    data.count = 0;
    data.time = now;
  }

  data.count++;
  actions.set(userId, data);

  return data.count;
}

// ================== جاهزية ==================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================== دخول سيرفر ==================
client.on('guildCreate', (guild) => {
  settings.set(guild.id, {
    logChannel: null,
    ticketCategory: null,
    antiNuke: true
  });
});

// ================== أوامر ==================
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  if (!settings.has(message.guild.id)) {
    settings.set(message.guild.id, {
      logChannel: null,
      ticketCategory: null,
      antiNuke: true
    });
  }

  const args = message.content.split(' ');
  const config = settings.get(message.guild.id);

  // ========== لوق ==========
  if (args[0] === '!setlog') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    config.logChannel = message.channel.id;
    message.reply('📜 تم تعيين اللوق');
  }

  // ========== Anti Nuke ==========
  if (args[0] === '!antinuke') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    config.antiNuke = args[1] === 'on';
    message.reply(`🛡️ AntiNuke: ${config.antiNuke}`);
  }

  // ========== فتح تذكرة ==========
  if (args[0] === '!ticket') {
    const channel = await message.guild.channels.create({
      name: `ticket-${message.author.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: message.author.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    message.reply(`🎫 تم فتح تذكرتك: ${channel}`);
  }

  // ========== إغلاق تذكرة ==========
  if (args[0] === '!close') {
    if (!message.channel.name.startsWith('ticket-')) return;
    message.channel.delete();
  }
});

// ================== Anti Ban ==================
client.on('guildBanAdd', async (ban) => {
  const config = settings.get(ban.guild.id);
  if (!config?.antiNuke) return;

  const logs = await ban.guild.fetchAuditLogs({ type: 22 });
  const executor = logs.entries.first()?.executor;
  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await ban.guild.members.fetch(executor.id).catch(() => null);
    if (member) member.kick("AntiNuke - Mass Ban");
  }

  sendLog(ban.guild, config.logChannel, `🚨 AntiBan: ${executor.tag}`);
});

// ================== Anti Channel Delete ==================
client.on('channelDelete', async (channel) => {
  const config = settings.get(channel.guild.id);
  if (!config?.antiNuke) return;

  const logs = await channel.guild.fetchAuditLogs({ type: 12 });
  const executor = logs.entries.first()?.executor;
  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await channel.guild.members.fetch(executor.id).catch(() => null);
    if (member) member.kick("AntiNuke - Channel Delete");
  }

  sendLog(channel.guild, config.logChannel, `🧨 Channel deleted by ${executor.tag}`);
});

// ================== Anti Role Delete ==================
client.on('roleDelete', async (role) => {
  const config = settings.get(role.guild.id);
  if (!config?.antiNuke) return;

  const logs = await role.guild.fetchAuditLogs({ type: 32 });
  const executor = logs.entries.first()?.executor;
  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await role.guild.members.fetch(executor.id).catch(() => null);
    if (member) member.kick("AntiNuke - Role Delete");
  }

  sendLog(role.guild, config.logChannel, `🧨 Role deleted by ${executor.tag}`);
});

// ================== اللوق ==================
async function sendLog(guild, channelId, text) {
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  channel.send(text).catch(() => {});
}

// ================== تشغيل ==================
client.login(process.env.DISCORD_TOKEN);
