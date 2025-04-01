const { Events } = require('discord.js');
const AutoResponse = require('../../schemas/autoResponse');  // Import schema auto-response

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Pastikan bot tidak merespons pesan dari dirinya sendiri
        if (message.author.bot) return;

        try {
            // Ambil data auto-response untuk guild ini
            const autoResponses = await AutoResponse.find({ GuildID: message.guild.id });

            // Cek apakah ada auto-response yang cocok dengan pesan yang dikirim
            for (const autoResponse of autoResponses) {
                const keyword = autoResponse.Keyword.toLowerCase();
                const messageContent = message.content.toLowerCase();

                // Jika kata kunci ditemukan dalam pesan
                if (messageContent.includes(keyword)) {
                    // Kirimkan pesan balasan
                    await message.reply(autoResponse.Response);
                    break;  // Jika sudah ada balasan, berhenti memeriksa respon lainnya
                }
            }
        } catch (error) {
            console.error('[AutoResponse Event] Error:', error);
        }
    },
};