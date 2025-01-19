import { Message } from "discord.js";
import db from "@db";
import { Nijika } from "./types";

const search_reply = async (msg: string) => {
    try {
        let res = await db.Reply.find({input: msg});
        let success = (res.length !== 0);
        let reply = "";
        if(res.length !== 0) {
            reply = res[Math.floor(Math.random() * res.length)].reply;
        }
        return { reply, success };
    } catch (e) {
        let success = false;
        return { e, success };
    };
}

export const auto_reply = async (msg: Message, bot: Nijika) => {
    if (!msg.channel.isSendable()) return;
    
    // normal reply
    const { reply, success } = await search_reply(msg.content);
    if (success) { 
        await msg.channel.send(`${reply as string}`);
    }
}