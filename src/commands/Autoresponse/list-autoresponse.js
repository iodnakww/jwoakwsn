const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AutoResponse = require('../../schemas/autoResponse'); // Import schema auto-response

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-autoresponse')
        .setDescription('View the list of all auto-responses in this server'),

    async execute(interaction) {
        const { guild } = interaction;

        try {
            // Ambil semua auto-response dari database
            const responses = await AutoResponse.find({ GuildID: guild.id });

            if (responses.length === 0) {
                return interaction.reply({ content: '❌ No auto-responses have been set up in this server.', ephemeral: true });
            }

            // Buat embed untuk menampilkan daftar auto-response
            const embed = new EmbedBuilder()
                .setTitle('📜 Auto-Response List')
                .setColor('Green')
                .setDescription(responses.map((res, index) => `**${index + 1}.** \`${res.Keyword}\` → ${res.Response}`).join('\n'))
                .setFooter({ text: `Total: ${responses.length} auto-responses` });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[List AutoResponse Command] Error:', error);
            return interaction.reply({ content: '❌ An error occurred while retrieving the auto-response list.', ephemeral: true });
        }
    },
};