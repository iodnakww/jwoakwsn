const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketSchema = require('../../schemas/ticketSystem');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const { guild, customId, channel } = interaction;
        const { SendMessages, ViewChannel, ReadMessageHistory } = PermissionFlagsBits;

        if (!['ticket-manage-menu'].includes(customId)) return;

        await interaction.deferUpdate();
        await interaction.deleteReply();

        TicketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id }, async (err, data) => {
            if (err) throw err;

            const errEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Something Went Wrong')
                .setDescription("An unexpected error occurred. Please try again later or contact support.")
                .setTimestamp();

            if (!data) {
                return interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
            }

            const targetMemberId = interaction.values[0];
            const findMember = data.MembersID.includes(targetMemberId);

            if (!findMember) {
                // Menambahkan member ke ticket
                data.MembersID.push(targetMemberId);
                channel.permissionOverwrites.edit(targetMemberId, {
                    SendMessages: true,
                    ViewChannel: true,
                    ReadMessageHistory: true
                }).catch(() => {});

                const addEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`✅ Successfully added <@${targetMemberId}> to the ticket.`);

                interaction.channel.send({ embeds: [addEmbed] }).catch(() => {});
                data.save();
            } else {
                // Menghapus member dari ticket
                data.MembersID = data.MembersID.filter(id => id !== targetMemberId);
                channel.permissionOverwrites.delete(targetMemberId).catch(() => {});

                const removeEmbed = new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription(`❌ Successfully removed <@${targetMemberId}> from the ticket.`);

                interaction.channel.send({ embeds: [removeEmbed] }).catch(() => {});
                data.save();
            }
        });
    }
};