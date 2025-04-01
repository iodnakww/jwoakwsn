const { Events, EmbedBuilder } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Cek apakah interaksi adalah string select menu
        if (!interaction.isStringSelectMenu()) return;

        const { customId, values, guildId, user } = interaction;

        // Hanya tangani menu dengan Custom ID 'selectmenu-product'
        if (customId !== "selectmenu-product") return;

        try {
            // Ambil data dari schema berdasarkan GuildID
            const data = await selectmenuSchema.findOne({ GuildID: guildId });
            if (!data) {
                return interaction.reply({ 
                    content: "There is no configuration for this select menu.", 
                    ephemeral: true 
                });
            }

            // Temukan opsi yang sesuai dengan pilihan pengguna
            const selectedOption = data.options.find(option => option.label === values[0]);

            if (!selectedOption) {
                return interaction.reply({ 
                    content: "Invalid option selected. Please try again.", 
                    ephemeral: true 
                });
            }

            // Kirimkan respons berdasarkan data yang diambil
            const responseEmbed = new EmbedBuilder()
                .setTitle(selectedOption.label) // Title mengikuti label dari opsi yang dipilih
                .setDescription(selectedOption.response)
                .setTimestamp();

            return interaction.reply({ 
                embeds: [responseEmbed], 
                ephemeral: true 
            });
        } catch (err) {
            console.error(`[SELECT_MENU] Error handling interaction:`, err);

            const errorEmbed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription("An error occurred while processing your selection. Please try again later.")
                .setColor("Red");

            return interaction.reply({ 
                embeds: [errorEmbed], 
                ephemeral: true 
            });
        }
    },
};