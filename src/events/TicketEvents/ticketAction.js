const { 
    Events, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    UserSelectMenuBuilder, 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const TicketSetup = require('../../schemas/ticketSetupSystem');
const TicketSchema = require('../../schemas/ticketSystem');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const { guild, member, customId, channel } = interaction;
        const { ManageChannels, SendMessages } = PermissionFlagsBits;

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        
        const docs = await TicketSetup.findOne({ GuildID: guild.id });
        if (!docs) return;

        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setDescription("Something went wrong. If you believe this is an error, please use `/bug-report` to notify the developers.")
            .setTitle('Error Occurred')
            .setTimestamp();

        const nopermissionsEmbed = new EmbedBuilder()
            .setColor('Red')
            .setDescription("You do not have permission to perform this action.");

        const alreadyEmbed = new EmbedBuilder().setColor('Orange');
        const executeEmbed = new EmbedBuilder().setColor('Aqua');

        if (interaction.isButton() && customId === 'ticket-close') {
            // Cek izin pengguna
            if ((!member.permissions.has(ManageChannels)) && (!member.roles.cache.has(docs.Handlers))) {
                return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
            }

            // Tampilkan modal untuk alasan penutupan tiket
            const modal = new ModalBuilder()
                .setCustomId('close-ticket-modal')
                .setTitle('Close Ticket Reason');

            const reasonInput = new TextInputBuilder()
                .setCustomId('close-reason')
                .setLabel('Reason for closing this ticket')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Enter the reason here...')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(actionRow);

            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === 'close-ticket-modal') {
            const reason = interaction.fields.getTextInputValue('close-reason');

            // Dapatkan data tiket
            const data = await TicketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id });
            if (!data) {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Kirim pesan penutupan tiket
            await interaction.reply({
                embeds: [new EmbedBuilder().setColor('Blue').setDescription('Closing this ticket...')],
                ephemeral: true,
            });

            const transcript = await createTranscript(channel, {
                limit: -1,
                returnType: 'attachment',
                saveImages: true,
                poweredBy: false,
                filename: `ticket-${data.TicketID}.html`,
            });

            const closingTicket = new EmbedBuilder()
                .setTitle("Ticket Closed")
                .setDescription("This ticket has been closed. Thank you for reaching out.")
                .setColor('Red');
            const closingEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle('Ticket Closed')
                .addFields(
                    { name: 'Ticket Name', value: `<#${data.ChannelID}>`, inline: true },
                    { name: 'Ticket Owner', value: `<@${data.OwnerID}>`, inline: true },
                    { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Close Date', value: `<t:${parseInt(Date.now() / 1000)}:F>`, inline: true },
                    { name: 'Reason', value: `${reason}`, inline: true },
                )
            await guild.channels.cache.get(docs.Logschannel).send({ embeds: [closingEmbed ]});
            
                const transcriptEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('Ticket Transcript')
                .addFields(
                    { name: 'Opened By', value: `<@${data.OwnerID}>`, inline: true },
                    { name: 'Ticket ID', value: `${data.TicketID}`, inline: true },
                    { name: 'Claimed', value: `${data.Claimed ? "✅" : "❌"}`, inline: true },
                    { name: 'Closed By', value: `<@${member.id}>`, inline: true },
                    { name: 'Reason', value: `${reason}`, inline: false },
                    { name: 'Claimed By', value: data.ClaimedBy ? `<@${data.ClaimedBy}>` : 'Not Claimed', inline: true }
                )
                .setColor('Green');

            if (transcript) {
                await guild.channels.cache.get(docs.Transcripts)?.send({ embeds: [transcriptEmbed], files: [transcript] });
            }

            await TicketSchema.findOneAndDelete({ GuildID: guild.id, ChannelID: channel.id });
            channel.send({ embeds: [closingTicket] });
            setTimeout(() => channel.delete(), 5000);
        }

        // Other ticket actions (lock, unlock, manage, claim)
        TicketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id }, async (err, data) => {
            if (err) throw err;
            if (!data) return;

            switch (customId) {
                case 'ticket-lock':
                    if ((!member.permissions.has(ManageChannels)) && (!member.roles.cache.has(docs.Handlers))) {
                        return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                    }

                    if (data.Locked) {
                        alreadyEmbed.setDescription("This ticket is already locked.");
                        return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
                    }

                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor('Blue').setDescription('Locking this ticket...')],
                        ephemeral: true,
                    });

                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Locked: true });
                    executeEmbed.setDescription("The ticket has been successfully locked.");
                    data.MembersID.forEach((m) => {
                        channel.permissionOverwrites.edit(m, { SendMessages: false });
                    });
                    channel.permissionOverwrites.edit(data.OwnerID, { SendMessages: false });
                    interaction.channel.send({ embeds: [executeEmbed] });
                    break;

                case 'ticket-unlock':
                    if ((!member.permissions.has(ManageChannels)) && (!member.roles.cache.has(docs.Handlers))) {
                        return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                    }

                    if (!data.Locked) {
                        alreadyEmbed.setDescription("This ticket is already unlocked.");
                        return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
                    }

                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor('Blue').setDescription('Unlocking this ticket...')],
                        ephemeral: true,
                    });

                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Locked: false });
                    executeEmbed.setDescription("The ticket has been successfully unlocked.");
                    data.MembersID.forEach((m) => {
                        channel.permissionOverwrites.edit(m, { SendMessages: true });
                    });
                    channel.permissionOverwrites.edit(data.OwnerID, { SendMessages: true });
                    interaction.channel.send({ embeds: [executeEmbed] });
                    break;

                case 'ticket-manage':
                    if ((!member.permissions.has(ManageChannels)) && (!member.roles.cache.has(docs.Handlers))) {
                        return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                    }

                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor('Blue').setDescription('Preparing ticket management menu...')],
                        ephemeral: true,
                    });

                    const menu = new UserSelectMenuBuilder()
                        .setCustomId('ticket-manage-menu')
                        .setPlaceholder("Select a user to manage the ticket")
                        .setMinValues(1)
                        .setMaxValues(1);

                    const row = new ActionRowBuilder().addComponents(menu);
                    interaction.followUp({ components: [row], ephemeral: true });
                    break;

                case 'ticket-claim':
                    if ((!member.permissions.has(ManageChannels)) && (!member.roles.cache.has(docs.Handlers))) {
                        return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                    }

                    if (data.Claimed) {
                        alreadyEmbed.setDescription(`This ticket is already claimed by <@${data.ClaimedBy}>.`);
                        return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
                    }

                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor('Blue').setDescription('Claiming this ticket...')],
                        ephemeral: true,
                    });

                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });
                    channel.edit({
                        name: `claimed-${channel.name}`,
                        topic: `This ticket has been claimed by <@${member.id}>.`,
                    });

                    executeEmbed.setDescription(`This ticket has been successfully claimed by <@${member.id}>.`);
                    interaction.channel.send({ embeds: [executeEmbed] });
                    break;
            }
        });
    },
};