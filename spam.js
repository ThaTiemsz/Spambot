var Discord = require("discord.js");
var client = new Discord.Client();

client.login("Mjc0ODY1OTk1MjcxODk3MDg5.C24VnQ.tZWsCg73UjEOJ4CuwNTTCcRHwkQ");

client.on("ready", () => {
	console.log("I'm ready to do work!");
});

const slowmode = new Map();
const ratelimit = 7500; // within 7.5s
const guild = "209719953706844161"; // guild id
const logChannel = "274871132497379328"; // logs channel id

client.on("message", msg => {

	if (msg.content.startsWith("!ping")) {
		let startTime = Date.now();
		msg.channel.sendMessage("Ping...").then(newMessage => {
			let endTime = Date.now();
			newMessage.edit("Pong! Took `" + Math.round(endTime - startTime) + "ms`!");
		});
	}

	function log(logmsg) {
		if (msg.guild.channels.has(logChannel)) {
			msg.guild.channels.get(logChannel).sendEmbed(logmsg).then().catch(err => console.log(err));
		}
	}

	let banLevel = 1;

	// Ignore DMS, Webhooks, Mods, and break if no perms
	if (msg.author.bot || !msg.guild || !msg.member || !msg.guild.member(client.user).hasPermission("BAN_MEMBERS") || msg.member.hasPermission("MANAGE_MESSAGES")) return;

	// Ignore if 1 mention and it's a bot (bot interaction)
	if (msg.mentions.users.size == 1 && msg.mentions.users.first().bot) return;

	// If there is no trace of the author in the slowmode map, add him.
	let entry = slowmode.get(msg.author.id);
	if (!entry) {
		entry = 0;
		slowmode.set(msg.author.id, entry);
	}

	// Count BOTH user and role mentions
	entry += msg.mentions.users.size + msg.mentions.roles.size;
	console.log(entry);
	console.log(slowmode);

	// If the total number of mentions in the last `ratelimit` is above the server ban level... well, ban their ass.
	if (entry > banLevel) {
		log(new Discord.RichEmbed().setTitle(':warning: Caution').setColor(0xFF8000).setTimestamp().addField('User', `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).addField('Reason', `Spamming mentions x${entry}`));

		msg.member.ban(1)
		.then(member => {
			msg.channel.sendMessage(`:ok_hand: banned \`${msg.author.username}#${msg.author.discriminator}\` for \`spam\``);

			log(new Discord.RichEmbed().setTitle(':hammer: Banned').setColor(0xFF0000).setTimestamp().addField('User', `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).addField('Reason', `Mentioning too many users (${entry})`));
		})
		.catch(e => {
			log(new Discord.RichEmbed().setTitle(':x: ERROR').setColor(0x000001).setTimestamp().addField('User', `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).addField('Reason', `Could not ban because they have a higher role`));
		});
	} else {
		setTimeout(()=> {
			entry -= msg.mentions.users.size + msg.mentions.roles.size;
			if(entry <= 0) slowmode.delete(msg.author.id);
		}, ratelimit);
	}

});

process.on("unhandledRejection", err => {
	console.error("Uncaught Promise Error: \n" + err.stack);
});