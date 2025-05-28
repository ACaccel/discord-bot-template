import { Message, TextChannel } from "discord.js";
import { BaseBot } from "@dcbotTypes";

const search_reply = async (msg: string, bot: BaseBot, guild_id: string) => {
    // search reply from database
    let success = false;
    const db = bot.guildInfo[guild_id].db;
    if (!db) {
        throw new Error("Cannot connect to MongoDB.");
    }
    let res = await db.models["Reply"].find({input: msg});
    success = (res.length !== 0);
    
    // if number of reply > 1, randomly select one
    let reply = "";
    if(res.length !== 0) {
        reply = res[Math.floor(Math.random() * res.length)].reply;
    }
    return { reply, success };
}

export const auto_reply = async (msg: Message, bot: BaseBot, guild_id: string, use_tts: boolean = false) => {
    if (!msg.channel.isSendable()) return;

    if (msg.author.bot) return; // prevent recusive reply
    
    // normal reply
    const { reply, success } = await search_reply(msg.content, bot, guild_id);
    if (success) {
        let msg_reply: { content: string; files?: any[] } = { content: reply as string };

        await msg.channel.send(msg_reply);
    }

    // special reply
    if (Math.random() > 0.995) {
        // reply to lucky
        const { reply, success } = await search_reply("[*]", bot, guild_id);
        if (success) {
            let msg_reply: { content: string; files?: any[] } = { content: reply as string };
    
            await msg.channel.send(msg_reply);
        }
    }
}