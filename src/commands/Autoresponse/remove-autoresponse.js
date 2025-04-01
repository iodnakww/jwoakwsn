const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const AutoResponse = require('../../schemas/autoResponse'); // Import schema auto-response

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-autoresponse')
        .setDescription('Remove a specific auto-response by keyword')
        .addStringOption(option =>
            option.setName('keyword')
                .setDescription('The keyword of the auto-response to remove')
                .setRequired(true)),

    async execute(interaction) {
        // Cek apakah user memiliki izin Administrator
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command. Only Administrators can use it.',
                ephemeral: true,
            });
        }

        const { guild, options } = interaction;
        const keyword = options.getString('keyword');

        try {
            // Cari dan hapus auto-response berdasarkan keyword
            const deleted = await AutoResponse.findOneAndDelete({ GuildID: guild.id, Keyword: keyword });

            if (!deleted) {
                return interaction.reply({ content: `❌ No auto-response found for keyword: **${keyword}**.`, ephemeral: true });
            }

            return interaction.reply({ content: `✅ Auto-response for keyword **"${keyword}"** has been removed.`, ephemeral: true });
        } catch (error) {
            console.error('[Remove AutoResponse Command] Error:', error);
            return interaction.reply({ content: '❌ An error occurred while removing the auto-response.', ephemeral: true });
        }
    },
};