const { Events, EmbedBuilder } = require('discord.js');
const linkSchema = require('../../schemas/antiLinkSystem');
const warningSchema = require('../../schemas/warningSystem');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Memastikan pesan berasal dari server (guild) yang valid
        if (!message.guild) return;

        // Cek jika pesan berisi link atau URL
        if (
            message.content.startsWith('http') ||
            message.content.startsWith('discord.gg') ||
            message.content.includes('https://') ||
            message.content.includes('http://') ||
            message.content.includes('discord.gg/') ||
            message.content.includes('www.') ||
            message.content.includes('.net') ||
            message.content.includes('.com')
        ) {
            const Data = await linkSchema.findOne({ Guild: message.guild.id });

            // Jika tidak ada data untuk guild ini, keluar
            if (!Data) return;

            const memberPerms = Data.Perms;
            const user = message.author;
            const member = message.guild.members.cache.get(user.id);

            // Buat embed untuk member yang mengirimkan link
            const embed = new EmbedBuilder()
                .setColor(client.config.embedModHard)
                .setAuthor({ name: `Anti-link system ${client.config.devBy}` })
                .setTitle(`${client.user.username} Anti-link system ${client.config.arrowEmoji}`)
                .setDescription(`> Link detected and deleted successfully! \n> ${message.author}, links are **disabled** in **${message.guild.name}**. Please **do not** send links in this server!`)
                .setFooter({ text: 'Anti-link detected a link' })
                .setThumbnail(client.user.avatarURL())
                .setTimestamp();

            // Cek jika member memiliki izin untuk mengirim link
            if (member && member.permissions.has(memberPerms)) return;

            // Kirim embed dan hapus pesan setelah 5 detik
            await message.channel.send({ embeds: [embed] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });

            // Hapus pesan yang mengandung link
            await message.delete();

            // Cek dan update data peringatan
            warningSchema.findOne({ GuildID: message.guild.id, UserID: message.author.id, UserTag: message.author.tag }, async (err, data) => {
                if (err) {
                    console.error('Error finding warning data:', err);
                    return;
                }

                // Jika data peringatan tidak ada, buat data baru
                if (!data) {
                    data = new warningSchema({
                        GuildID: message.guild.id,
                        UserID: message.author.id,
                        UserTag: message.author.tag,
                        Content: [
                            {
                                ExecuterId: '1211784897627168778',
                                ExecuterTag: 'Azis.exe',
                                Reason: 'Use of forbidden links'
                            }
                        ]
                    });
                } else {
                    // Tambahkan peringatan baru jika sudah ada data
                    const warnContent = {
                        ExecuterId: '1211784897627168778',
                        ExecuterTag: 'Gem',
                        Reason: 'Use of forbidden links'
                    };
                    data.Content.push(warnContent);
                }

                // Simpan perubahan data peringatan
                try {
                    await data.save();
                } catch (saveErr) {
                    console.error('Error saving warning data:', saveErr);
                }
            });
        }
    }
};