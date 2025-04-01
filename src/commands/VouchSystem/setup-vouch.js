const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Rating = require("../../schemas/vouchSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-vouch")
        .setDescription("Set up a vouch channel for the server")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)  // Hanya bisa digunakan oleh Administrator
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel where vouch will be posted")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),

    async execute(interaction) {
        // Cek apakah pengguna memiliki izin administrator
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            // Kirim pesan jika pengguna tidak memiliki izin administrator
            const noPermissionEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("🚫 You do not have the required **Administrator** permission to use this command.")
                .setTimestamp()
                .setFooter({ text: "Permission Denied", iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        }

        const { options, guild } = interaction;
        const channel = options.getChannel("channel");

        try {
            // Update or create the rating channel configuration in the database
            await Rating.findOneAndUpdate(
                { Guild: guild.id },
                { Channel: channel.id },
                { upsert: true, new: true }
            );

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`✅ Successfully set up ${channel} as the vouch channel.`)
                .setTimestamp()
                .setFooter({ text: "Vouch system setup", iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error setting up the vouch channel:", error);

            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("❌ An error occurred while setting up the vouch channel. Please try again later.")
                .setTimestamp()
                .setFooter({ text: "Vouch system setup failed", iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};