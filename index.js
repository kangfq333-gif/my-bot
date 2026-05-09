const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================== إعدادات السيرفر ==================
const settings = new Map();

// ================== تشغيل ==================
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================== إنشاء إعدادات ==================
client.on('guildCreate', (guild) => {
  settings.set(guild.id, {
    logChannel: null,
    ticketMessage: "🎫 اضغط الزر لفتح تذكرة",
    ticketCategoryName: "Tickets"
  });
});

// ================== أوامر ==================
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(' ');
  const config = settings.get(message.guild.id);

  if (!config) return;

  // ================== لوحة التحكم ==================
  if (args[0] === '!panel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embed = new EmbedBuilder()
      .setTitle("🛠️ لوحة التحكم")
      .setDescription(`
🎫 التذاكر: \`!ticketpanel\`
📜 تعيين اللوق: \`!setlog\`
✏️ تغيير رسالة التذكرة: \`!ticketmsg <text>\`
      `)
      .setColor('Blue');

    message.channel.send({ embeds: [embed] });
  }

  // ================== تعيين لوق ==================
  if (args[0] === '!setlog') {
    config.logChannel = message.channel.id;
    message.reply('📜 تم تعيين اللوق هنا');
  }

  // ================== تغيير رسالة التذكرة ==================
  if (args[0] === '!ticketmsg') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    config.ticketMessage = args.slice(1).join(' ');
    message.reply('🎫 تم تغيير رسالة التذكرة');
  }

  // ================== إرسال لوحة التذاكر ==================
  if (args[0] === '!ticketpanel') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎫 فتح تذكرة')
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("🎫 نظام التذاكر")
      .setDescription(config.ticketMessage)
      .setColor("Green");

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // ================== إغلاق تذكرة ==================
  if (args[0] === '!close') {
    if (!message.channel.name.includes('ticket')) return;
    message.channel.delete();
  }
});

// ================== زر فتح تذكرة ==================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const config = settings.get(interaction.guild.id);

  if (interaction.customId === 'open_ticket') {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    channel.send(`🎫 تم فتح تذكرتك <@${interaction.user.id}>`);

    interaction.reply({
      content: `تم إنشاء التذكرة: ${channel}`,
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
