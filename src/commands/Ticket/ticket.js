const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const TicketSetup = require('../../schemas/ticketSetupSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('A command to setup the ticket system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel where the tickets should be created.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Select the parent where the tickets should be created.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Choose a description for the ticket embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('button')
                .setDescription('Choose a name for the first button.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Choose an emoji for the first button.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Set a title for the ticket embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Set a color for the ticket embed (e.g., #235ee7 or "Blue").')
                .setRequired(true))
        .addChannelOption(option => option.setName('logs-channel')
            .setDescription('Select the channel where the logs should be sent.')
                .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('handlers')
                .setDescription('Select the ticket handlers role.')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('logs-transcripts')
                .setDescription('Select the channel where the logs transcripts should be sent.')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('button2')
                .setDescription('Choose a name for the second button.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji2')
                .setDescription('Choose an emoji for the second button.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('button3')
                .setDescription('Choose a name for the third button.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji3')
                .setDescription('Choose an emoji for the third button.')
                .setRequired(false)),

    async execute(interaction, client) {
        const { guild, options } = interaction;

        try {
            const channel = options.getChannel('channel');
            const category = options.getChannel('category');
            const description = options.getString('description');
            const button = options.getString('button');
            const emoji = options.getString('emoji');
            const button2 = options.getString('button2');
            const emoji2 = options.getString('emoji2');
            const button3 = options.getString('button3');
            const emoji3 = options.getString('emoji3');
            const title = options.getString('title');
            const color = options.getString('color') || null;
            const transcripts = options.getChannel('logs-transcripts') || null;
            const logschannel = options.getChannel('logs-channel') || null;
            const handlers = options.getRole('handlers');

            // Simpan ke database
            await TicketSetup.findOneAndUpdate(
                { GuildID: guild.id },
                {
                    Channel: channel.id,
                    Category: category.id,
                    Transcripts: transcripts ? transcripts.id : null,
                    Logschannel: logschannel ? logschannel.id : null,
                    Handlers: handlers.id,
                    Description: description,
                    Button: button,
                    Emoji: emoji,
                    Button2: button2,
                    Emoji2: emoji2,
                    Button3: button3,
                    Emoji3: emoji3,
                    Title: title,
                    Color: color,
                },
                {
                    new: true,
                    upsert: true,
                }
            );

            // Buat embed tiket
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color);

            // Buat tombol-tombol
            const button1Component = new ButtonBuilder()
                .setCustomId(button)
                .setLabel(button)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Primary);

            const components = new ActionRowBuilder().addComponents(button1Component);

            if (button2 && emoji2) {
                const button2Component = new ButtonBuilder()
                    .setCustomId(button2)
                    .setLabel(button2)
                    .setEmoji(emoji2)
                    .setStyle(ButtonStyle.Secondary);
                components.addComponents(button2Component);
            }

            if (button3 && emoji3) {
                const button3Component = new ButtonBuilder()
                    .setCustomId(button3)
                    .setLabel(button3)
                    .setEmoji(emoji3)
                    .setStyle(ButtonStyle.Success);
                components.addComponents(button3Component);
            }

            // Kirim embed ke channel yang ditentukan
            await channel.send({ embeds: [embed], components: [components] });

            // Kirim konfirmasi dengan embed mendetail
            const sendSuccessEmbed = new EmbedBuilder()
                .setAuthor({ name: `Ticket system ${client.config.devBy}` })
                .setTitle(`${client.user.username} ticket system ${client.config.arrowEmoji}`)
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp()
                .setColor('Green')
                .setDescription('The ticket panel was successfully created.')
                .addFields({ name: 'Ticket channel', value: `<#${channel.id}>`, inline: true })
                .addFields({ name: 'Category', value: `<#${category.id}>`, inline: true })
                .addFields({ name: 'Transcripts', value: transcripts ? `<#${transcripts.id}>` : 'Not provided', inline: true })
                .addFields({ name: 'Handlers', value: `<@&${handlers.id}>`, inline: true })
                .addFields({ name: 'Description', value: `${description}`, inline: true })
                .addFields({ name: 'Title', value: `${title}`, inline: true })
                .addFields({ name: 'Color', value: `${color}`, inline: true })
                .addFields({ name: 'Button 1', value: `ButtonName: ${button} Emoji: (${emoji})`, inline: true })
                .addFields({ name: 'Button 2', value: button2 ? `ButtonName: ${button2} Emoji: (${emoji2})` : 'Not provided', inline: true })
                .addFields({ name: 'Button 3', value: button3 ? `ButtonName: ${button3} Emoji:(${emoji3})` : 'Not provided', inline: true })
                .setFooter({ text: `Created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [sendSuccessEmbed], ephemeral: true });
        } catch (err) {
            client.logs.error(`[TICKET_SYSTEM] Error creating ticket system for ${interaction.user.username} in ${guild.name}`, err);

            const errEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`If you believe this to be an error in the bot, please use \`\`/bug-report\`\` and report the problem to the developers.`)
                .setTitle('Somethings gone wrong...')
                .setTimestamp();

            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
    },
};