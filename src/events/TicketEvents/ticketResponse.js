const { Events, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const TicketSchema = require('../../schemas/ticketSystem');
const TicketSetup = require('../../schemas/ticketSetupSystem');
const TicketCounterSchema = require('../../schemas/ticketCounter');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const { guild, member, customId, channel } = interaction;
        const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory } = PermissionFlagsBits;

        // Cek apakah interaksi adalah tombol
        if (!interaction.isButton()) return;

        // Ambil data konfigurasi sistem tiket
        const data = await TicketSetup.findOne({ GuildID: guild.id });
        if (!data) return;

        // Cek apakah tombol yang ditekan sesuai dengan tombol yang disimpan
        const validButtons = [data.Button, data.Button2, data.Button3];
        if (!validButtons.includes(customId)) return;

        // Periksa jika pengguna sudah memiliki tiket
        const alreadyticketEmbed = new EmbedBuilder()
            .setDescription(client.config.ticketAlreadyExist || "You already have a ticket.")
            .setColor('Red');

        const findTicket = await TicketSchema.findOne({ GuildID: guild.id, OwnerID: member.id });
        if (findTicket) {
            return interaction.reply({ embeds: [alreadyticketEmbed], ephemeral: true }).catch(console.error);
        }

        // Periksa jika bot memiliki izin yang diperlukan
        if (!guild.members.me.permissions.has(ManageChannels)) {
            return interaction.reply({ content: client.config.ticketMissingPerms || "Missing permissions.", ephemeral: true }).catch(console.error);
        }

        try {
            // Defer reply untuk memberi waktu tambahan
            await interaction.deferReply({ ephemeral: true });

            // Ambil atau buat counter ID tiket dari database
            let ticketCounter = await TicketCounterSchema.findOne({ GuildID: guild.id });
            if (!ticketCounter) {
                ticketCounter = await TicketCounterSchema.create({ GuildID: guild.id, LastTicketID: 0 });
            }

            // Increment ID tiket
            const ticketId = ticketCounter.LastTicketID + 1;
            ticketCounter.LastTicketID = ticketId;
            await ticketCounter.save();

            // Buat channel baru untuk tiket
            const newChannel = await guild.channels.create({
                name: `${client.config.ticketName || "ticket-"}${ticketId}`,
                type: ChannelType.GuildText,
                parent: data.Category,
                permissionOverwrites: [
                    {
                        id: guild.id, // Everyone role (default role for the server)
                        deny: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                    {
                        id: data.Handlers, // Role untuk handler
                        allow: [ViewChannel, SendMessages, ReadMessageHistory, ManageChannels],
                    },
                    {
                        id: member.id, // User yang membuat tiket
                        allow: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                ],
            });

            // Simpan data tiket ke database
            await TicketSchema.create({
                GuildID: guild.id,
                OwnerID: member.id,
                MemberID: member.id,
                TicketID: ticketId,
                ChannelID: newChannel.id,
                Locked: false,
                Claimed: false,
            });

            // Set topik channel
            await newChannel.setTopic(`${client.config.ticketDescription || "Ticket for"} <@${member.id}>`);

            // Kirim pesan embed ke channel tiket
            const embed = new EmbedBuilder()
                .setTitle(client.config.ticketMessageTitle || "Ticket Created")
                .setDescription(client.config.ticketMessageDescription || `Please wait for a staff member to assist you.\n\n**Ticket ID:** ${ticketId}\n**Ticket Owner:** <@${member.id}>\n**Ticket Type:** ${customId}\nTime At: <t:${Math.floor(Date.now() / 1000)}:t> (<t:${Math.floor(Date.now() / 1000)}:R>)`)
                .setColor('Blue');

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-close')
                    .setLabel(client.config.ticketClose || "Close")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.config.ticketCloseEmoji || "🔒"),
                new ButtonBuilder()
                    .setCustomId('ticket-lock')
                    .setLabel(client.config.ticketLock || "Lock")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.config.ticketLockEmoji || "🔐"),
                new ButtonBuilder()
                    .setCustomId('ticket-unlock')
                    .setLabel(client.config.ticketUnlock || "Unlock")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.config.ticketUnlockEmoji || "🔓"),
                new ButtonBuilder()
                    .setCustomId('ticket-manage')
                    .setLabel(client.config.ticketManage || "Add-users")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(client.config.ticketManageEmoji || "➕"),
                new ButtonBuilder()
                    .setCustomId('ticket-claim')
                    .setLabel(client.config.ticketClaim || "Claim")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(client.config.ticketClaimEmoji || "✅"),
            );

            await newChannel.send({ content: `<@${member.id}> <@&${data.Handlers}>`, embeds: [embed], components: [button] });

            // Mention role handlers untuk tiket
            const handlersmention = await newChannel.send({ content: `<@&${data.Handlers}>` });
            handlersmention.delete().catch(console.error);

            // Kirim konfirmasi ke pengguna
            const ticketmessage = new EmbedBuilder()
                .setDescription(`${client.config.ticketCreate || "Ticket created"} <#${newChannel.id}>`)
                .setColor('Green');

            await interaction.followUp({ embeds: [ticketmessage] });
            const ticketlogs = new EmbedBuilder()
                .setTitle('Ticket Created')
                .setColor('Green')
                .addFields(
                    { name: 'Ticket Name', value: `[${newChannel.name}](${newChannel.url})`, inline: true },
                    { name: 'Ticket Owner', value: `<@${member.id}>`, inline: true },
                    { name: 'Time At', value: `<t:${Math.floor(Date.now() / 1000)}:t> (<t:${Math.floor(Date.now() / 1000)}:R>)`, inline: true },
                    { name: 'Ticket Type', value: `${customId}`, inline: true },
                )
            await guild.channels.cache.get(data.Logschannel).send({ embeds: [ticketlogs ]});
        } catch (err) {
            console.error(`[TICKET_SYSTEM] Error creating ticket in ${guild.name}:`, err);
            if (!interaction.replied) {
                return interaction.followUp({ content: "An error occurred while creating the ticket.", ephemeral: true });
            }
        }
    },
};