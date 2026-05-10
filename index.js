const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require('discord.js');

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

client.on('messageCreate', async (message) => {

  console.log("MSG:", message.content);

  if (!message.guild || message.author.bot) return;

  if (message.content === '!panel') {

    const embed = new EmbedBuilder()
      .setTitle('🛠️ لوحة التحكم')
      .setDescription('البوت شغال 100%')
      .setColor('Blue');

    message.channel.send({ embeds: [embed] });
  }

});

client.login(process.env.DISCORD_TOKEN);
