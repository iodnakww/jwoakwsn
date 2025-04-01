const { Events } = require('discord.js');
const sticky = require('../../schemas/stickyMessageSystem');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!message.guild || !message.channel || message.author.bot) return;

        // Ambil data sticky message untuk channel ini
        const data = await sticky.findOne({ Guild: message.guild.id, Channel: message.channel.id });
        if (!data) return;

        // Pastikan Count adalah angka, jika tidak set ke 0
        if (typeof data.Count !== 'number' || isNaN(data.Count)) {
            data.Count = 0;
        }

        // Ambil pesan terbaru di channel
        const messages = await message.channel.messages.fetch({ limit: 10 });

        // Temukan sticky message terakhir yang dikirim bot
        const lastSticky = messages.find(msg => 
            msg.author.id === client.user.id && msg.content.startsWith("__**Sticky Message**__:")
        );

        // Jika ada sticky message sebelumnya, hapus terlebih dahulu
        if (lastSticky) await lastSticky.delete();

        // Format sticky message
        const stickyMessage = `__**Sticky Message**__:\n\n${data.Message}`;

        // Kirim sticky message baru
        await message.channel.send(stickyMessage);

        // Perbarui jumlah pesan yang telah dikirim (Count)
        data.Count = (data.Count >= data.Cap - 1) ? 0 : data.Count + 1;
        
        await data.save();
    }
};