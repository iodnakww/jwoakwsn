const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send-panel-product")
        .setDescription("Send a select menu product panel for a specific channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addChannelOption(option => 
            option.setName("channel")
                .setDescription("Select the channel to send the panel to")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Set a title for the panel embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Set a description for the panel embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer_text')
                .setDescription('Set footer text for the embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer_icon')
                .setDescription('Set footer icon for the embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('Set an image URL for the embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Set a color for the embed (e.g., #235ee7 or "Blue").')
                .setRequired(false)),

    async execute(interaction) {
        const { options, guildId, channel } = interaction;
        const targetChannel = options.getChannel("channel");
        const title = options.getString('title') || "Select Menu Panel";
        const description = options.getString('description') || "Choose an option from the menu below.";
        const footerText = options.getString('footer_text');
        const footerIcon = options.getString('footer_icon');
        const image = options.getString('image');
        const color = options.getString('color') || "#235ee7";

        try {
            const data = await selectmenuSchema.findOne({ GuildID: guildId });
            if (!data) return interaction.reply({ content: "No product menu data found for this server.", ephemeral: true });

            const channelData = data.channels.find(ch => ch.channelID === targetChannel.id);
            if (!channelData || !channelData.options.length) {
                return interaction.reply({ content: "No product options configured for this channel.", ephemeral: true });
            }

            const menuOptions = channelData.options.map(option => ({
                label: option.label,
                value: option.label,
                description: option.description || "No description provided.",
                emoji: option.emoji || undefined,
            }));

            const panelEmbed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color);

            if (footerText || footerIcon) {
                panelEmbed.setFooter({ text: footerText || null, iconURL: footerIcon || null });
            }
            if (image) {
                panelEmbed.setImage(image);
            }

            const menuComponents = [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('selectmenu-product')
                        .setPlaceholder("Select Product")
                        .setMaxValues(1)
                        .addOptions(menuOptions)
                ),
            ];

            await targetChannel.send({ embeds: [panelEmbed], components: menuComponents });

            return interaction.reply({ content: "Successfully sent the select menu panel.", ephemeral: true });
        } catch (err) {
            console.error(err);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('An error occurred while trying to create the panel. Please try again later.');

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
