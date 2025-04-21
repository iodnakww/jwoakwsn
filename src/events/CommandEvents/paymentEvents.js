const { Events, EmbedBuilder } = require('discord.js');
const PaymentSetup = require('../../schemas/paymentSetup');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Tambahkan pengecekan khusus untuk tombol payment
        if (!interaction.customId.startsWith('pay-')) return;

        const { guild, customId } = interaction;

        const setup = await PaymentSetup.findOne({ GuildID: guild.id });
        if (!setup) return;

        const methodKey = customId.replace("pay-", "").toLowerCase();
        const method = setup.Payments.find(p => p.Method.toLowerCase() === methodKey);
        if (!method) return;

        const embed = new EmbedBuilder()
            .setTitle(`Metode Pembayaran: ${method.Method}`)
            .setColor('Green')
            .setDescription(`**Nomor:** \`${method.Number}\``);

        if (method.QR) {
            embed.setImage(method.QR); // Link gambar QR atau path lokal
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
