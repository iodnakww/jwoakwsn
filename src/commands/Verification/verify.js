const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const capschema = require('../../schemas/verifySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDMPermission(false)
        .setDescription('Configure your verification system using captcha.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(command =>
            command
                .setName('setup')
                .setDescription('Sets up the verification system for you.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Specified role will be given to users who are verified.')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Specified channel will be your verify channel.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Specified channel to log verification activities.')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Specified message will be included in the verification embed.')
                        .setRequired(false)
                        .setMinLength(1)
                        .setMaxLength(1000)
                )
        )
        .addSubcommand(command =>
            command.setName('disable').setDescription('Disables your verification system.')
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== `${client.config.developers}`)
            return await interaction.reply({ content: `${client.config.noPerms}`, ephemeral: true });

        const data = await capschema.findOne({ Guild: interaction.guild.id });
        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'setup':
                const role = interaction.options.getRole('role');
                const channel = interaction.options.getChannel('channel');
                const logChannel = interaction.options.getChannel('log_channel');
                const message = interaction.options.getString('content') || '__Click the button below to verify!__';

                if (data)
                    return await interaction.reply({ content: `You **already** have a verification system **set up**! Use \`/verify disable\` to undo.`, ephemeral: true });

                await capschema.create({
                    Guild: interaction.guild.id,
                    Role: role.id,
                    Channel: channel.id,
                    LogChannel: logChannel ? logChannel.id : null,
                    Message: 'empty',
                    Verified: []
                });

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify')
                        .setLabel('Verify')
                        .setStyle(ButtonStyle.Success)
                );

                const verifyEmbed = new EmbedBuilder()
                    .setColor(client.config.embedVerify)
                    .setThumbnail(interaction.guild.iconURL())
                    .setTimestamp()
                    .setTitle(`${client.user.username} Verification System ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `Verification System ${client.config.devBy}` })
                    .setFooter({ text: `${interaction.guild.name} Verification System` })
                    .setDescription(`> ${message}`);

                await interaction.reply({ content: `Your **verification system** has been enabled!`, ephemeral: true });
                const msg = await channel.send({ embeds: [verifyEmbed], components: [buttons] });

                await capschema.updateOne({ Guild: interaction.guild.id }, { $set: { Message: msg.id } });
                break;

            case 'disable':
                if (!data)
                    return await interaction.reply({ content: `🚫 The **verification system** has not been **set up** yet. Use **/verify setup** again`, ephemeral: true });

                await capschema.deleteMany({ Guild: interaction.guild.id });

                try {
                    const verifyChannel = client.channels.cache.get(data.Channel);
                    if (verifyChannel) {
                        const deletemsg = await verifyChannel.messages.fetch(data.Message).catch(() => null);
                        if (deletemsg) await deletemsg.delete();
                    }
                } catch (error) {
                    console.error(`Failed to delete verification message:`, error);
                }

                await interaction.reply({ content: `Your **verification system** has successfully been **disabled**!`, ephemeral: true });
                break;
        }
    }
};