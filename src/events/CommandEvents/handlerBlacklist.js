const { Events } = require('discord.js');
const Blacklist = require('../../schemas/blacklist');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const blacklistEntry = await Blacklist.findOne({ guildId: member.guild.id, userId: member.id });

            if (blacklistEntry) {
                if (blacklistEntry.expiresAt && blacklistEntry.expiresAt <= new Date()) {
                    await Blacklist.deleteOne({ _id: blacklistEntry._id }); // Hapus jika sudah expired
                    return;
                }

                await member.roles.add(blacklistEntry.roleId).catch(() => null);

                // Kirim DM ke user saat masuk kembali dengan blacklist aktif
                await member.user.send(`⚠️ **You are still blacklisted in ${member.guild.name}!**\n\n- **Role:** <@&${blacklistEntry.roleId}>\n- **Status:** Your blacklist is still active.`).catch(() => null);
            }
        } catch (error) {
            console.error('[Guild Member Add] Error checking blacklist:', error);
        }
    },
};