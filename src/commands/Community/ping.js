const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Send a fully customizable embed message to the channel')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed (Hex code, e.g., #FF5733)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('The footer text of the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL of an image to include in the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('URL of a thumbnail image to include in the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('Name of the author to display in the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('authorurl')
                .setDescription('URL of the author to link to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('authoricon')
                .setDescription('URL of an author icon (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('timestamp')
                .setDescription('Include timestamp? (yes/no)')
                .setRequired(true)
                .addChoices(
                    { name: 'Yes', value: 'yes' },
                    { name: 'No', value: 'no' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Only users with Manage Messages permission can use this command

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const footer = interaction.options.getString('footer');
        const imageUrl = interaction.options.getString('image');
        const thumbnailUrl = interaction.options.getString('thumbnail');
        const author = interaction.options.getString('author');
        const authorUrl = interaction.options.getString('authorurl');
        const authorIcon = interaction.options.getString('authoricon');
        const timestampChoice = interaction.options.getString('timestamp') === 'yes' ? true : false;

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color);

        // Add optional footer
        if (footer) embed.setFooter({ text: footer });

        // Add image if URL provided
        if (imageUrl) embed.setImage(imageUrl);

        // Add thumbnail if URL provided
        if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

        // Add author details if provided
        if (author) {
            embed.setAuthor({ name: author, url: authorUrl, iconURL: authorIcon });
        }

        // Add timestamp if requested
        if (timestampChoice) embed.setTimestamp();

        // Send the embed to the channel
        await interaction.reply({ content: "Your full embed has been sent!", ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });
    }
};
