const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const AutoResponse = require('../../schemas/autoResponse');  // Import schema auto-response

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-autoresponse')
        .setDescription('Set a keyword and response for auto-reply')
        .addStringOption(option =>
            option.setName('keyword')
                .setDescription('The keyword to trigger the auto-reply')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('response')
                .setDescription('The response to be sent when the keyword is mentioned')
                .setRequired(true)),

    async execute(interaction) {
        // Check if the user has Administrator permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command. Only Administrators can use it.',
                ephemeral: true,
            });
        }

        const { guild, options } = interaction;

        // Retrieve user inputs
        const keyword = options.getString('keyword');
        const response = options.getString('response');

        try {
            // Check if an auto-response already exists for the specified keyword in this server
            const existingResponse = await AutoResponse.findOne({ GuildID: guild.id, Keyword: keyword });
            if (existingResponse) {
                return interaction.reply({ content: '❌ This keyword already has an auto-response set.', ephemeral: true });
            }

            // Save the auto-response data to the database
            const newAutoResponse = new AutoResponse({
                GuildID: guild.id,
                Keyword: keyword,
                Response: response,
            });
            await newAutoResponse.save();

            return interaction.reply({ content: `✅ Auto-response has been set for the keyword: "${keyword}".`, ephemeral: true });
        } catch (error) {
            console.error('[AutoResponse Command] Error:', error);
            return interaction.reply({ content: '❌ An error occurred while setting the auto-response.', ephemeral: true });
        }
    },
};