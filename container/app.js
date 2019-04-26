(async ()=>{

	const token = (process.env.TOKEN || require("./gitkey.json").key);
	const userName = process.env.USERNAME;
	const moduleName = process.env.MODULENAME;
	const os = require("os");
	const host = os.hostname();
	const path = require("path");
	const port = process.env.PORT || 3000;

	let {Utils, Publisher, Communication, SystemEvent, styles, index} = await require("./loadlibrary.js")({ moduleName, userName, token });

	const publisher = new Publisher({
		http: require("http").createServer,
		websocket: require("ws").Server,
		host,
		port,
		crypto: require('crypto')
	});

	await publisher.subscribe("","text/html").then(() => index);
	await publisher.subscribe("getDate","application/json").then(()=> JSON.stringify(new Date()));
	await publisher.subscribe("styles.css","text/css").then(()=> styles);
	await publisher.subscribe("eventpublisher.js","text/javascript").then(()=> `${Utils.toString()}\r\n${Communication.toString()}\r\n ${Publisher.toString()}\r\n${SystemEvent.toString()}`);

})().catch((err)=>{
	console.log(err);
});