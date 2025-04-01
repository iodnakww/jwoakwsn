const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Testimoni = require('../../schemas/testimoni');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testimoni')
        .setDescription('Send a testimonial proof of transaction.')
        .addUserOption(option =>
            option.setName('seller')
                .setDescription('The seller you want to rate.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('buyer')
                .setDescription('The buyer you want to rate.')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price')
                .setDescription('The price of the product.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('product')
                .setDescription('The name of the product.')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Proof image for the transaction.')
                .setRequired(true)),

    async execute(interaction) {
        const { options, guild, member } = interaction;

        // Ambil data dari input user
        const seller = options.getUser('seller');
        const buyer = options.getUser('buyer');
        const price = options.getNumber('price');
        const product = options.getString('product');
        const image = options.getAttachment('image');

        // Validasi harga
        if (!price || isNaN(price) || price < 0) {
            return interaction.reply({
                content: '❌ Harga tidak valid. Pastikan angka yang dimasukkan benar.',
                ephemeral: true,
            });
        }

        const formattedPrice = parseFloat(price).toLocaleString('id-ID');

        // Ambil data dari database
        const guildData = await Testimoni.findOne({ Guild: guild.id });

        if (!guildData || !guildData.Channel || !guildData.SellerRole) {
            return interaction.reply({
                content: '❌ Channel testimoni atau seller role belum diatur. Gunakan command `/setuptestimoni`.',
                ephemeral: true,
            });
        }

        // Validasi role
        const sellerRole = guildData.SellerRole;
        if (!member.roles.cache.has(sellerRole)) {
            return interaction.reply({
                content: '❌ Anda tidak memiliki izin untuk menggunakan command ini. Hanya pengguna dengan role tertentu yang dapat mengirim testimoni.',
                ephemeral: true,
            });
        }

        // Cek apakah pembeli sudah ada di database
        let buyerData = await Testimoni.findOne({ Guild: guild.id, Buyer: buyer.id });

        if (buyerData) {
            // Update transaksi pembeli
            buyerData.Transactions += 1;
            await buyerData.save();
        } else {
            // Tambahkan pembeli baru
            await Testimoni.create({
                Guild: guild.id,
                Buyer: buyer.id,
                Transactions: 1,
            });
        }

        const transactionCount = buyerData ? buyerData.Transactions : 1;

        const testimoniChannel = guild.channels.cache.get(guildData.Channel);

        if (!testimoniChannel) {
            return interaction.reply({
                content: '❌ Channel testimoni tidak ditemukan. Silakan atur ulang dengan `/setuptestimoni`.',
                ephemeral: true,
            });
        }

        // Buat embed testimoni
        const embed = new EmbedBuilder()
            .setTitle('Testimonial Transaction')
            .setDescription(`Terima kasih telah melakukan transaksi, jangan lupa berikan penilaian!`)
            .addFields(
                { name: 'Informasi Testimoni', value: `**Buyer:** ||${buyer}|| (${transactionCount}x Buy)\n**Seller:** ${seller}\n**Product:** ${product}\n**Price:** Rp ${formattedPrice}`, inline: true }
            )
            .setImage(image.url)
            .setColor('#F1F1F1')
            .setTimestamp();

        // Kirim embed ke channel testimoni
        testimoniChannel.send({ embeds: [embed] });

        // Berikan respons ke pengguna
        return interaction.reply({
            content: `✅ Testimoni berhasil dikirim ke ${testimoniChannel}!`,
            ephemeral: true,
        });
    },
};