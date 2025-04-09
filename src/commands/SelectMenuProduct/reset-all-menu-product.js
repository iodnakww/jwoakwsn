const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-menu-product")
        .setDescription("Reset a specific product menu in a channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addChannelOption(option => 
            option.setName("channel")
                .setDescription("Select the channel to reset the product menu")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("label")
                .setDescription("The label of the product to reset")
                .setRequired(true)
        ),

    async execute(interaction) {
        const { options, guildId } = interaction;
        const targetChannel = options.getChannel("channel");
        const label = options.getString("label");

        try {
            const data = await selectmenuSchema.findOne({ GuildID: guildId });
            if (!data) return interaction.reply({ content: "No product menu data found for this server.", ephemeral: true });

            const channelData = data.channels.find(ch => ch.channelID === targetChannel.id);
            if (!channelData || !channelData.options.length) {
                return interaction.reply({ content: "No product options configured for this channel.", ephemeral: true });
            }

            const productIndex = channelData.options.findIndex(option => option.label === label);
            if (productIndex === -1) {
                return interaction.reply({ content: `No product found with the label: **${label}**`, ephemeral: true });
            }

            channelData.options.splice(productIndex, 1); // Remove the product with the specified label
            await data.save();

            const successEmbed = new EmbedBuilder()
                .setTitle("Product Reset")
                .setDescription(`The product with label **${label}** has been successfully reset in channel **${targetChannel.name}**.`)
                .setColor("Green");

            return interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (err) {
            console.error(err);
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Error")
                .setDescription("An error occurred while resetting the product. Please try again later.");

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
