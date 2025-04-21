const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits
} = require('discord.js');
const PaymentSetup = require('../../schemas/paymentSetup');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('payment-panel')
      .setDescription('Setup the payment system.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption(option =>
          option.setName('channel')
              .setDescription('Channel where the payment panel will be sent.')
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText))
      .addStringOption(option =>
          option.setName('title')
              .setDescription('Embed title.')
              .setRequired(true))
      .addStringOption(option =>
          option.setName('description')
              .setDescription('Embed description.')
              .setRequired(true)),

  async execute(interaction) {
      const { guild, options } = interaction;
      const channel = options.getChannel('channel');
      const title = options.getString('title');
      const description = options.getString('description');

      const existing = await PaymentSetup.findOne({ GuildID: guild.id });
      if (!existing || existing.Payments.length === 0) {
          return interaction.reply({ content: "No payment methods found in database. Use `/set-payment` to add one.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('Green');

      const row = new ActionRowBuilder();
      for (const method of existing.Payments) {
          row.addComponents(
              new ButtonBuilder()
                  .setCustomId(`pay-${method.Method.toLowerCase()}`)
                  .setLabel(method.Method)
                  .setEmoji(method.Emoji)
                  .setStyle(ButtonStyle.Primary)
          );
      }

      await channel.send({ embeds: [embed], components: [row] });
      await PaymentSetup.updateOne({ GuildID: guild.id }, { ChannelID: channel.id });

      return interaction.reply({ content: 'Payment panel created!', ephemeral: true });
  },
};
