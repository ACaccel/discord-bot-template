import { 
    Client, 
    GatewayIntentBits, 
    Events,
} from 'discord.js';
import dotenv from "dotenv";

import { Config, AllowedTextChannel } from '@dcbotTypes';
import { Nijika } from './types';
import { auto_reply } from './message_reply';
import config from './config.json';
import utils from '@utils';

dotenv.config({ path: './src/bot/nijika/.env' });

// init
const client: Client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
    ] 
});
const nijika = new Nijika(
    client,
    process.env.TOKEN as string,
    process.env.MONGO_URI as string,
    process.env.CLIENT_ID as string,
    config as Config
);

// client events
nijika.login();
nijika.client.on(Events.ClientReady, async () => {
    // bot online init
    nijika.registerGuild();
    await nijika.registerSlashCommands();
    nijika.initSlashCommandsHandlers();
    nijika.messageBackup(nijika.nijikaConfig.backup_server, 10);

    // reboot message
    Object.entries(nijika.guildInfo).forEach(async ([guild_id, guild]) => {
        const debug_ch = nijika.guildInfo[guild_id].channels.debug as AllowedTextChannel;
        await debug_ch.send(`${guild.bot_name}重開機囉!`);
    });
});

nijika.client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.inGuild()) {
        if (interaction.isChatInputCommand()) {
            await nijika.executeSlashCommands(nijika, interaction);
        } else {
            if (!interaction.isAutocomplete()) {
                await interaction.reply({ content: '目前尚不支援此類型的指令喔!', ephemeral: true });
            }
        }
    } else {
        if (!interaction.isAutocomplete()) {
            await interaction.reply({ content: '目前尚不支援在伺服器外使用喔!', ephemeral: true });
        }
    }
});

nijika.client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    try {
        await auto_reply(message, nijika);
    } catch (e) {
        utils.errorLogger(nijika.clientId, e);
    }
});

nijika.client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (nijika.nijikaConfig.blocked_channels.includes(oldMessage.channel.id)) return;

    try {
        await nijika.detectMessageUpdate(oldMessage, newMessage);
    } catch (e) {
        utils.errorLogger(nijika.clientId, e);
    }
});

nijika.client.on(Events.MessageDelete, async (message) => {
    if (nijika.nijikaConfig.blocked_channels.includes(message.channel.id)) return;

    try {
        await nijika.detectMessageDelete(message);
    } catch (e) {
        utils.errorLogger(nijika.clientId, e);
    }
});

nijika.client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        await nijika.detectGuildMemberUpdate(oldMember, newMember);
    } catch (e) {
        utils.errorLogger(nijika.clientId, e);
    }
});