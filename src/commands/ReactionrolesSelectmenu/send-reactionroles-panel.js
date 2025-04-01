const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits 
} = require("discord.js");
const rrSchema = require("../../schemas/ReactionRoles");

module.exports = {
    premiumOnly: false,
    data: new SlashCommandBuilder()
        .setName("send-reactionroles-panel")
        .setDescription("Reaction role panel.")
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
        const { options, guildId, guild, channel } = interaction;

        try {
            const data = await rrSchema.findOne({ GuildID: guildId });
            if (!data || !data.roles.length)
                return interaction.reply({ content: "This server does not have any reaction role data.", ephemeral: true });

            const title = options.getString('title') || "Reaction Role Panel";
            const description = options.getString('description') || "Select a role below to receive updates.";
            const footerText = options.getString('footer_text');
            const footerIcon = options.getString('footer_icon');
            const image = options.getString('image');
            const color = options.getString('color') || "#235ee7"; // Default color if none provided

            // Create the embed
            const panelEmbed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color); // Set the embed color

            if (footerText || footerIcon) {
                panelEmbed.setFooter({ text: footerText || null, iconURL: footerIcon || null });
            }
            if (image) {
                panelEmbed.setImage(image);
            }

            // Map roles to options
            const optionsData = data.roles.map(x => {
                const role = guild.roles.cache.get(x.roleId);
                return {
                    label: role.name,
                    value: role.id,
                    description: x.roleDescription || "No description provided.",
                    emoji: x.roleEmoji || undefined
                };
            });

            // Create the select menu
            const menuComponents = [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('reaction-roles')
                        .setPlaceholder("Select your roles")
                        .setMaxValues(optionsData.length)
                        .addOptions(optionsData),
                ),
            ];

            // Send the embed and select menu
            await channel.send({ embeds: [panelEmbed], components: menuComponents });

            return interaction.reply({ content: "Successfully sent the reaction role panel.", ephemeral: true });
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