const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Send an announcement to the channel')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('embed')
                .setDescription('Send as an embed message?')
                .setRequired(true)
                .addChoices(
                    { name: 'Yes', value: 'yes' },
                    { name: 'No', value: 'no' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Hanya pengguna dengan izin Manage Messages yang bisa menggunakannya

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const embedChoice = interaction.options.getString('embed');

        await interaction.reply({ content: "Sent announcement in channel!", ephemeral: true });

        if (embedChoice === 'yes') {
            const embed = new EmbedBuilder()
                .setTitle('📢 Announcement')
                .setDescription(message)
                .setTimestamp();

            await interaction.channel.send({ content: '@everyone', embeds: [embed] });
        } else {
            await interaction.channel.send(message);
        }
    }
};