const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const actions = new Map();

function addAction(userId) {
  const now = Date.now();
  const data = actions.get(userId) || { count: 0, time: now };

  if (now - data.time > 10000) {
    data.count = 0;
    data.time = now;
  }

  data.count += 1;
  actions.set(userId, data);

  return data.count;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Anti Ban
client.on('guildBanAdd', async (ban) => {
  const logs = await ban.guild.fetchAuditLogs({ type: 22 });
  const executor = logs.entries.first()?.executor;

  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await ban.guild.members.fetch(executor.id).catch(() => null);
    if (member) await member.kick("Anti-Nuke: Mass Ban");
  }
});

// Anti Channel Delete
client.on('channelDelete', async (channel) => {
  const logs = await channel.guild.fetchAuditLogs({ type: 12 });
  const executor = logs.entries.first()?.executor;

  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await channel.guild.members.fetch(executor.id).catch(() => null);
    if (member) await member.kick("Anti-Nuke: Channel Delete");
  }
});

// Anti Role Delete
client.on('roleDelete', async (role) => {
  const logs = await role.guild.fetchAuditLogs({ type: 32 });
  const executor = logs.entries.first()?.executor;

  if (!executor) return;

  const count = addAction(executor.id);

  if (count >= 3) {
    const member = await role.guild.members.fetch(executor.id).catch(() => null);
    if (member) await member.kick("Anti-Nuke: Role Delete");
  }
});

client.login(process.env.DISCORD_TOKEN);
