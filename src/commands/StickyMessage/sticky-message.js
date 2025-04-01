const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const sticky = require('../../schemas/stickyMessageSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky-message')
        .setDescription('Manage sticky messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(command => 
            command.setName('setup')
                .setDescription('Set a sticky message')
                .addStringOption(option => 
                    option.setName('message')
                        .setDescription('The message to stick')
                        .setRequired(true))
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to send the sticky message in')
                        .setRequired(true)))
        .addSubcommand(command => 
            command.setName('disable')
                .setDescription('Remove a sticky message')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to remove the sticky message from')
                        .setRequired(true)))
        .addSubcommand(command => 
            command.setName('check')
                .setDescription('Check active sticky messages')),

    async execute(interaction, client) {
        const { options } = interaction;
        const sub = options.getSubcommand();

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({ content: `${client.config.noPerms}`, ephemeral: true });
        }

        async function sendMessage(content) {
            const embed = new EmbedBuilder()
                .setColor(client.config.embedModLight)
                .setTitle(`${client.user.username} Sticky Message Tool ${client.config.arrowEmoji}`)
                .setDescription(content)
                .setTimestamp()
                .setFooter({ text: `Sticky Message System` });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        switch (sub) {
            case 'setup': {
                const channel = options.getChannel('channel');
                const message = options.getString('message');

                const existingData = await sticky.findOne({ Guild: interaction.guild.id, Channel: channel.id });

                if (existingData) {
                    await sendMessage(`A sticky message already exists in <#${channel.id}>! Use \`/sticky-message disable\` to remove it first.`);
                    return;
                }

                await sticky.create({
                    Guild: interaction.guild.id,
                    Message: message,
                    Channel: channel.id
                });

                await sendMessage(`Sticky message set in <#${channel.id}>: "\`${message}\`"`);
                
                // Hapus sticky message lama jika ada sebelum mengirim yang baru
                const messages = await channel.messages.fetch({ limit: 10 });
                const lastSticky = messages.find(msg => msg.author.id === client.user.id && msg.embeds.length > 0);
                if (lastSticky) await lastSticky.delete();

                // Kirim sticky message baru
                const embed = new EmbedBuilder()
                    .setColor(client.config.embedModLight)
                    .setTitle(`${client.user.username} Sticky Message System ${client.config.arrowEmoji}`)
                    .setDescription(`> ${message}`)
                    .setTimestamp();

                await channel.send({ embeds: [embed] });

                break;
            }

            case 'disable': {
                const channel = options.getChannel('channel');
                const data = await sticky.findOne({ Guild: interaction.guild.id, Channel: channel.id });

                if (!data) {
                    await sendMessage(`No sticky message found in <#${channel.id}>.`);
                    return;
                }

                await sticky.deleteOne({ Guild: interaction.guild.id, Channel: channel.id });

                await sendMessage(`Sticky message removed from <#${channel.id}>!`);

                // Hapus sticky message terakhir jika ada
                const messages = await channel.messages.fetch({ limit: 10 });
                const lastSticky = messages.find(msg => msg.author.id === client.user.id && msg.embeds.length > 0);
                if (lastSticky) await lastSticky.delete();

                break;
            }

            case 'check': {
                const data = await sticky.find({ Guild: interaction.guild.id });

                if (!data.length) {
                    await sendMessage(`No active sticky messages in this server.`);
                    return;
                }

                let messageList = data.map(d => `> **Message:** \`${d.Message}\`\n> **Channel:** <#${d.Channel}>`).join("\n\n");

                await sendMessage(`Here are your active sticky messages:\n\n${messageList}`);

                break;
            }
        }
    }
};