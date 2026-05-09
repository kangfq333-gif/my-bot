const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
  ],
  partials: [Partials.Channel]
});

// إعدادات السيرفر
const settings = new Map();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// أول دخول سيرفر
client.on('guildCreate', (guild) => {
  settings.set(guild.id, {
    antiBan: true,
    logChannel: null
  });
});

// أوامر بسيطة
client.on('messageCreate', (message) => {
  if (!message.guild || message.author.bot) return;

  if (!settings.has(message.guild.id)) {
    settings.set(message.guild.id, {
      antiBan: true,
      logChannel: null
    });
  }

  const args = message.content.split(' ');
  const config = settings.get(message.guild.id);

  // أمر تفعيل/تعطيل الحماية
  if (args[0] === '!antiban') {
    if (!message.member.permissions.has('Administrator')) return;

    if (args[1] === 'on') {
      config.antiBan = true;
      message.reply('🛡️ AntiBan Enabled');
    }

    if (args[1] === 'off') {
      config.antiBan = false;
      message.reply('🛡️ AntiBan Disabled');
    }
  }

  // تعيين لوق
  if (args[0] === '!setlog') {
    if (!message.member.permissions.has('Administrator')) return;

    config.logChannel = message.channel.id;
    message.reply('📜 Log channel set');
  }
});

// حماية باند
client.on('guildBanAdd', async (ban) => {
  const guildConfig = settings.get(ban.guild.id);
  if (!guildConfig?.antiBan) return;

  const audit = await ban.guild.fetchAuditLogs({ type: 22 });
  const executor = audit.entries.first()?.executor;

  if (!executor) return;

  const member = await ban.guild.members.fetch(executor.id).catch(() => null);

  if (member) {
    await member.kick("Anti-Ban Protection");
  }
});

client.login(process.env.DISCORD_TOKEN);
