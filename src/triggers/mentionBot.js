const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,

    async execute(message, client) {
        if (message.author.bot) return;
        
        // Cek apakah pesan berisi mention ke bot
        if (message.content.includes(`<@${client.user.id}>`)) {
            return message.reply("Ada yang bisa bantu?");
        }
    },
};