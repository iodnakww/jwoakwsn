const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Rating = require("../../schemas/vouchSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-vouch')
        .setDescription('Reset the Vouch No and display how many times it\'s been used.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only allow Administrators (or Server Owner)
    
    async execute(interaction) {
        const { guild, user } = interaction;

        // Cek apakah pengguna adalah pemilik server
        if (guild.ownerId !== user.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription("❌ You do not have the required permission to use this command. Only the server owner can execute this.")
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Cari data rating untuk guild saat ini
            const data = await Rating.findOne({ Guild: guild.id });

            if (!data) {
                // Jika data tidak ada, beri respons bahwa rating channel belum diatur
                return interaction.editReply({
                    content: "No rating data found for this server. Please set up the rating system first using `/setuprating`.",
                    ephemeral: true,
                });
            }

            // Tampilkan Vouch No yang digunakan
            const vouchUsed = data.VouchNo;

            // Reset Vouch No ke 0
            await Rating.updateOne(
                { Guild: guild.id },
                { $set: { VouchNo: 0 } }
            );

            interaction.editReply({
                content: `✅ Successfully reset the Vouch No.\nVouch No was used ${vouchUsed} times before resetting.`,
                ephemeral: true,
            });

        } catch (error) {
            console.error("Error resetting Vouch No:", error);
            interaction.editReply({
                content: "❌ An error occurred while resetting the Vouch No. Please try again later.",
                ephemeral: true,
            });
        }
    },
};