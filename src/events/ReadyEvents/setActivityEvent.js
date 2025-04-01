const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        
        client.logs.info(`[ROTATING_STATUS] Setting rotating status...`);

        setInterval(() => {

            let activities = [
                { type: ActivityType.Playing, name: `with ${client.guilds.cache.reduce((a,b) => a + b.memberCount, 0)} members!` },
                { type: ActivityType.Custom, name: `Enjoying with me!! ` }
            ];

            const status = activities[Math.floor(Math.random() * activities.length)];

            client.user.setPresence({
                activities: [{ name: status.name, type: status.type }]
            });

        }, 7500);
        
        client.logs.success(`[ROTATING_STATUS] Rotating status loaded successfully.`);
    }
}