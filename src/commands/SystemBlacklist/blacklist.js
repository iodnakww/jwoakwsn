const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Blacklist = require('../../schemas/blacklist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the blacklist system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // Subcommand: Add user to blacklist
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Blacklist a user with a specific role and duration')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to assign for blacklist')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in minutes (0 = permanent)')
                        .setRequired(true)))

        // Subcommand: Remove user from blacklist
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove from blacklist')
                        .setRequired(true)))

        // Subcommand: List all blacklisted users
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all blacklisted users in this server')),

    async execute(interaction) {
        const { guild, options } = interaction;
        const subcommand = options.getSubcommand();

        try {
            if (subcommand === 'add') {
                const user = options.getUser('user');
                const role = options.getRole('role');
                const duration = options.getInteger('duration');

                const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60000) : null;

                await Blacklist.findOneAndUpdate(
                    { guildId: guild.id, userId: user.id },
                    { roleId: role.id, expiresAt },
                    { upsert: true, new: true }
                );

                const member = await guild.members.fetch(user.id).catch(() => null);
                if (member) await member.roles.add(role.id);

                // Kirim DM ke user
                await user.send(`🚨 **You have been blacklisted in ${guild.name}!**\n\n- **Role:** ${role.name}\n- **Duration:** ${duration > 0 ? `${duration} minutes` : 'Permanent'}\n\nYou will not be able to participate normally in the server until your blacklist expires.`).catch(() => null);

                if (expiresAt) {
                    setTimeout(async () => {
                        const checkBlacklist = await Blacklist.findOne({ guildId: guild.id, userId: user.id });
                        if (checkBlacklist && checkBlacklist.expiresAt && checkBlacklist.expiresAt <= new Date()) {
                            if (member) await member.roles.remove(role.id).catch(() => null);
                            await Blacklist.deleteOne({ _id: checkBlacklist._id });

                            // Kirim DM saat blacklist berakhir
                            await user.send(`✅ **Your blacklist in ${guild.name} has expired!**\n\nYou are now free to participate in the server again.`).catch(() => null);
                        }
                    }, duration * 60000);
                }

                return interaction.reply({
                    content: `✅ **${user.username}** has been blacklisted with the role **${role.name}**${duration > 0 ? ` for **${duration} minutes**.` : ' permanently.'}`,
                    ephemeral: false
                });

            } else if (subcommand === 'remove') {
                const user = options.getUser('user');
                const blacklistEntry = await Blacklist.findOne({ guildId: guild.id, userId: user.id });

                if (!blacklistEntry) {
                    return interaction.reply({ content: `❌ **${user.username}** is not blacklisted.`, ephemeral: true });
                }

                await Blacklist.deleteOne({ guildId: guild.id, userId: user.id });

                const member = await guild.members.fetch(user.id).catch(() => null);
                if (member) await member.roles.remove(blacklistEntry.roleId).catch(() => null);

                // Kirim DM ke user
                await user.send(`✅ **You have been removed from the blacklist in ${guild.name}!**\n\nYou are now free to participate in the server again.`).catch(() => null);

                return interaction.reply({ content: `✅ **${user.username}** has been removed from the blacklist.`, ephemeral: false });

            } else if (subcommand === 'list') {
                const blacklistedUsers = await Blacklist.find({ guildId: guild.id });

                if (blacklistedUsers.length === 0) {
                    return interaction.reply({ content: '✅ No users are currently blacklisted.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('🚫 Blacklist Users')
                    .setColor('Red')
                    .setDescription(blacklistedUsers.map((entry, index) => 
                        `**${index + 1}.** <@${entry.userId}> | Role: <@&${entry.roleId}> | **${entry.expiresAt ? `Expires: <t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>` : 'Permanent'}**`
                    ).join('\n'))
                    .setFooter({ text: `Total blacklisted users: ${blacklistedUsers.length}` });

                return interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('[Blacklist Command] Error:', error);
            return interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
        }
    },
};