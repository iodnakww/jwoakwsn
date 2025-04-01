const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, // Ganti SelectMenuBuilder dengan StringSelectMenuBuilder
    PermissionFlagsBits 
} = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    premiumOnly: false,
    data: new SlashCommandBuilder()
        .setName("send-panel-product")
        .setDescription("Send a select menu product panel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
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
                .setDescription('Set a footer text for the panel embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('footer_icon')
                .setDescription('Set a footer icon URL for the panel embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('Set an image URL for the panel embed.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Set a color for the panel embed (e.g., #235ee7 or "Blue").')
                .setRequired(false)),

    async execute(interaction) {
        const { options, guildId, channel } = interaction;

        try {
            const data = await selectmenuSchema.findOne({ GuildID: guildId });
            if (!data || !data.options.length)
                return interaction.reply({ content: "This server does not have any select menu options configured.", ephemeral: true });

            const title = options.getString('title') || "Select Menu Panel";
            const description = options.getString('description') || "Choose an option from the menu below.";
            const footerText = options.getString('footer_text');
            const footerIcon = options.getString('footer_icon');
            const image = options.getString('image');
            const color = options.getString('color') || "#235ee7";

            // Buat embed
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

            // Buat opsi untuk select menu
            const menuOptions = data.options.map(option => ({
                label: option.label,
                value: option.label,
                description: option.description || "No description provided.",
                emoji: option.emoji || undefined,
            }));

            // Buat select menu menggunakan StringSelectMenuBuilder
            const menuComponents = [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder() // Ganti dengan StringSelectMenuBuilder
                        .setCustomId('selectmenu-product')
                        .setPlaceholder("Select Product")
                        .setMaxValues(1)
                        .addOptions(menuOptions),
                ),
            ];

            // Kirim embed dan select menu
            await channel.send({ embeds: [panelEmbed], components: menuComponents });

            return interaction.reply({ content: "Successfully sent the select menu panel.", ephemeral: true });
        } catch (err) {
            console.error(err);

            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('An error occurred while trying to create the panel. Please try again later.');

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};