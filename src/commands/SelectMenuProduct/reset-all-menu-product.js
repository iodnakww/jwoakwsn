const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-all-menu-product")
        .setDescription("Reset all menu product data.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Hanya Administrator yang dapat menjalankan
    async execute(interaction) {
        const { guildId } = interaction;

        // Buat embed konfirmasi
        const confirmEmbed = new EmbedBuilder()
            .setTitle("Confirm Reset")
            .setDescription("Are you sure you want to reset all menu product data? This action is irreversible.")
            .setColor("Yellow");

        // Buat tombol Yes dan No
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("reset_yes")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("reset_no")
                .setLabel("No")
                .setStyle(ButtonStyle.Secondary)
        );

        // Kirim pesan konfirmasi
        const message = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

        // Tunggu interaksi tombol
        const collector = message.createMessageComponentCollector({
            time: 15000, // 15 detik waktu tunggu
            filter: (btnInteraction) => btnInteraction.user.id === interaction.user.id,
        });

        collector.on("collect", async (btnInteraction) => {
            if (btnInteraction.customId === "reset_yes") {
                // Jika user menekan tombol Yes
                try {
                    const deletedData = await selectmenuSchema.deleteOne({ GuildID: guildId });

                    if (deletedData.deletedCount === 0) {
                        await btnInteraction.update({
                            content: "No menu product data found to reset for this server.",
                            embeds: [],
                            components: [],
                        });
                        return;
                    }

                    const successEmbed = new EmbedBuilder()
                        .setTitle("Reset Complete")
                        .setDescription("All menu product data has been successfully reset.")
                        .setColor("Green");

                    await btnInteraction.update({ embeds: [successEmbed], components: [] });
                } catch (err) {
                    console.error(err);

                    const errorEmbed = new EmbedBuilder()
                        .setTitle("Error")
                        .setDescription("An error occurred while resetting menu product data.")
                        .setColor("Red");

                    await btnInteraction.update({ embeds: [errorEmbed], components: [] });
                }
            } else if (btnInteraction.customId === "reset_no") {
                // Jika user menekan tombol No
                await btnInteraction.update({
                    content: "Action canceled.",
                    embeds: [],
                    components: [],
                });
            }

            collector.stop(); // Hentikan pengumpulan setelah interaksi
        });

        collector.on("end", (collected, reason) => {
            if (reason === "time") {
                interaction.editReply({
                    content: "No response received. Action canceled.",
                    embeds: [],
                    components: [],
                });
            }
        });
    },
};