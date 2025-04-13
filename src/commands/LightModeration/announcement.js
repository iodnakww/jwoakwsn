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
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Optional image to include')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image_description')
                .setDescription('Description for the image (if using embed)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const embedChoice = interaction.options.getString('embed');
        const image = interaction.options.getAttachment('image');
        const imageDesc = interaction.options.getString('image_description');

        await interaction.reply({ content: "Sent announcement in channel!", ephemeral: true });

        const shouldForceEmbed = image && imageDesc && image.contentType?.startsWith('image/');

        if (embedChoice === 'yes' || shouldForceEmbed) {
            const embed = new EmbedBuilder()
                .setTitle('📢 Announcement')
                .setDescription(imageDesc)
                .setTimestamp();

            if (image && image.contentType?.startsWith('image/')) {
                embed.setImage(image.url);
            }

            await interaction.channel.send({
                content: `@everyone\n${message}`,
                embeds: [embed]
            });
        } else {
            const options = {
                content: `@everyone\n${message}`
            };

            if (image && image.contentType?.startsWith('image/')) {
                options.files = [image];
            }

            await interaction.channel.send(options);
        }
    }
};
