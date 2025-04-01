const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const GoodbyeMessage = require("../../schemas/goodbyeSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("goodbye-system")
        .setDescription("Configure the goodbye message system")
        .addSubcommand(subcommand =>
            subcommand.setName("set")
                .setDescription("Set the goodbye message system to the server")
                .addStringOption(option =>
                    option.setName("message")
                        .setDescription("The goodbye message to send. `Use {user} to mention the user`")
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("The channel to send goodbye messages to")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("remove")
                .setDescription("Remove the goodbye message system from the server")
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        
        let goodbyeMessage = await GoodbyeMessage.findOne({ guildId });

        if (!goodbyeMessage) {
            goodbyeMessage = new GoodbyeMessage({ guildId });
        }

        if (subcommand === "set") {
            const channelId = interaction.options.getChannel("channel").id;
            const message = interaction.options.getString("message");

            goodbyeMessage.channelId = channelId;
            goodbyeMessage.message = message;
            await goodbyeMessage.save();

            const successEmbed = new EmbedBuilder()
                .setAuthor({ name: `Goodbye System Command ${client.config.devBy}` })
                .setTitle(`${client.user.username} Goodbye System Tool ${client.config.arrowEmoji}`)
                .setColor(client.config.embedModLight)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription(`> Goodbye message set to: **${message}**.\n\nChannel: <#${channelId}>`)
                .setFooter({ text: `Goodbye system has been setup!` })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } else if (subcommand === "remove") {
            if (!goodbyeMessage) {
                return await interaction.reply({ content: "Goodbye system **has not** yet been set up in this guild. To set up, use `/goodbye-system set`.", ephemeral: true });
            }

            await GoodbyeMessage.deleteOne({ guildId });

            const removedEmbed = new EmbedBuilder()
                .setAuthor({ name: `Goodbye System Command ${client.config.devBy}` })
                .setTitle(`${client.user.username} Goodbye System Tool ${client.config.arrowEmoji}`)
                .setColor(client.config.embedModLight)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription("> Goodbye message has been **removed** from this server")
                .setFooter({ text: `Goodbye system has been removed!` })
                .setTimestamp();

            await interaction.reply({ embeds: [removedEmbed], ephemeral: true });
        }
    },
};