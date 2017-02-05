var Discord = require("discord.js");
var client = new Discord.Client();

client.login("YOUR BOT TOKEN HERE");

client.on("ready", () => {
	console.log("I'm ready to do work!");
});

const slowmode_mentions = new Map();
const slowmode_links = new Map();
const slowmode_attachments = new Map();
const ratelimit = 7500; // within 7.5 seconds
const logChannel = "LOG CHANNEL ID HERE"; // logs channel id

client.on("message", message => {

	if (message.content.startsWith("!ping")) {
		let startTime = Date.now();
		message.channel.sendMessage("Ping...").then(newMessage => {
			let endTime = Date.now();
			newMessage.edit("Pong! Took `" + Math.round(endTime - startTime) + "ms`!");
		});
	}

	function log(logmessage) {
		if (message.guild.channels.has(logChannel)) {
			message.guild.channels.get(logChannel).sendEmbed(logmessage).then().catch(err => console.log(err));
		}
	}

	// set the max mentions/links/attachments that are allowed
	let banLevel = {
		"mentions": 10,
		"links": 10,
		"attachments": 10
	};

	// Ignore bots, DMs, Webhooks, if this bot has no perms, and Mods
	if (message.author.bot || !message.guild || !message.member || !message.guild.member(client.user).hasPermission("BAN_MEMBERS") || message.member.hasPermission("MANAGE_MESSAGES")) return;

	// Ignore if 1 mention and it's a bot (bot interaction)
	if (message.mentions.users.size == 1 && message.mentions.users.first().bot) return;

	// If there is no trace of the author in the slowmode map, add them.
	let entry_mentions = slowmode_mentions.get(message.author.id);
	let entry_links = slowmode_links.get(message.author.id);
	let entry_attachments = slowmode_attachments.get(message.author.id);

	if (!entry_mentions) {
		entry_mentions = 0;
		slowmode_mentions.set(message.author.id, entry_mentions);
	}
	if (!entry_links) {
		entry_links = 0;
		slowmode_links.set(message.author.id, entry_links);
	}
	if (!entry_attachments) {
		entry_attachments = 0;
		slowmode_attachments.set(message.author.id, entry_attachments);
	}

	// Count the unique user and roles mentions, links and attachments
	entry_mentions += message.mentions.users.size + message.mentions.roles.size;
	entry_links += message.embeds.length;
	entry_attachments += message.attachments.size;
	// Set all the amounts in the slowmode maps
	slowmode_mentions.set(message.author.id, entry_mentions);
	slowmode_links.set(message.author.id, entry_links);
	slowmode_attachments.set(message.author.id, entry_attachments);

	// If the total number of links in the last ratelimit is above the server ban level, ban user
	if (entry_links > banLevel.links) {
		message.member.ban(1).then(member => {
			message.channel.sendMessage(`:ok_hand: banned \`${message.author.username}#${message.author.discriminator}\` for \`link spam\``);
			log(new Discord.RichEmbed().setTitle(':hammer: Banned').setColor(0xFF0000).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Posting too many links (${entry_links}x)`));
			slowmode_links.delete(message.author.id);
		})
		.catch(e => {
			log(new Discord.RichEmbed().setTitle(':x: ERROR').setColor(0x000001).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Could not ban because they have a higher role`));
		});
	} else {
		setTimeout(()=> {
			entry_links -= message.embeds.length;
			if(entry_links <= 0) slowmode_links.delete(message.author.id);
		}, ratelimit);
	}

	if (entry_mentions > banLevel.mentions) {
		message.member.ban(1).then(member => {
			message.channel.sendMessage(`:ok_hand: banned \`${message.author.username}#${message.author.discriminator}\` for \`mention spam\``);
			log(new Discord.RichEmbed().setTitle(':hammer: Banned').setColor(0xFF0000).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Mentioning too many users (${entry_mentions}x)`));
			slowmode_mentions.delete(message.author.id);
		})
		.catch(e => {
			log(new Discord.RichEmbed().setTitle(':x: ERROR').setColor(0x000001).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Could not ban because they have a higher role`));
		});
	} else {
		setTimeout(()=> {
			entry_mentions -= message.mentions.users.size + message.mentions.roles.size;
			if(entry_mentions <= 0) slowmode_mentions.delete(message.author.id);
		}, ratelimit);
	}

	if (entry_attachments > banLevel.attachments) {
		message.member.ban(1).then(member => {
			message.channel.sendMessage(`:ok_hand: banned \`${message.author.username}#${message.author.discriminator}\` for \`image spam\``);
			log(new Discord.RichEmbed().setTitle(':hammer: Banned').setColor(0xFF0000).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Posting too many images (${entry_attachments}x)`));
			slowmode_attachments.delete(message.author.id);
		})
		.catch(e => {
			log(new Discord.RichEmbed().setTitle(':x: ERROR').setColor(0x000001).setTimestamp().addField('User', `${message.author.username}#${message.author.discriminator} (${message.author.id})`).addField('Reason', `Could not ban because they have a higher role`));
		});
	} else {
		setTimeout(()=> {
			entry_attachments -= message.attachments.size;
			if(entry_attachments <= 0) slowmode_attachments.delete(message.author.id);
		}, ratelimit);
	}

});

process.on("unhandledRejection", err => {
	console.error("Uncaught Promise Error: \n" + err.stack);
});