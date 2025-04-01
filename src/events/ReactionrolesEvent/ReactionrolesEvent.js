const { Events } = require("discord.js");
const rrSchema = require("../../schemas/ReactionRoles");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return; // Gunakan isStringSelectMenu() sesuai update terbaru
        if (interaction.customId !== "reaction-roles") return; // Pastikan Custom ID cocok

        const { values, guild, member } = interaction;

        try {
            // Ambil data reaction roles dari database
            const data = await rrSchema.findOne({ GuildID: guild.id });
            if (!data) 
                return interaction.reply({ content: "No reaction role data found for this server.", ephemeral: true });

            const rolesToAdd = [];

            // Iterasi melalui semua role yang dipilih oleh user
            for (const roleId of values) {
                const role = guild.roles.cache.get(roleId);
                if (!role) continue; // Abaikan role yang tidak ditemukan di server

                if (!member.roles.cache.has(roleId)) {
                    rolesToAdd.push(role);
                }
            }

            // Tambahkan semua role yang dipilih tanpa menghapus yang lain
            if (rolesToAdd.length) await member.roles.add(rolesToAdd);

            // Buat pesan respons berdasarkan role yang ditambahkan
            let responseMessage = "No changes were made to your roles.";
            if (rolesToAdd.length) {
                responseMessage = `Added roles: ${rolesToAdd.map(r => `\`${r.name}\``).join(", ")}.`;
            }

            // Kirim respons ke user
            await interaction.reply({
                content: responseMessage,
                ephemeral: true
            });
        } catch (err) {
            console.error(`[INTERACTION_CREATE] Error:`, err);
            await interaction.reply({
                content: `An error occurred while updating your roles. Please try again later.`,
                ephemeral: true
            });
        }
    },
};