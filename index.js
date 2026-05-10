const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {

  console.log("MSG:", message.content);

  if (message.author.bot) return;

  if (message.content === '!panel') {
    message.reply('✅ البوت شغال');
  }

});

client.login(process.env.DISCORD_TOKEN);
