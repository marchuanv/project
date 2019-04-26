function Communication( { http, websocket, crypto }){
	
	const callbacks=[];
	const utils = new Utils();
	const sourceId = utils.generateGUID();
	const firstPriority = 1;
	const secondPriority = 2;
	const thirdPriority = 3;

	const createMessage = (channel, data, priority, sourceId)=>{
		const id = utils.generateGUID();
		return {id, channel, data, priority, sourceId};
	};

	const clientBrowserWebsocketConnect = (port, host, channel, callback)=>{
		const conn = new websocket(`ws://${host}:${port}`, "echo-protocol");
		conn.onmessage =  async (evt) => {
			const receivedMessage = utils.getJSONObject(evt.data);
			await callbacks.every(async receive => { await receive(receivedMessage, (replyMessage)=>{
				conn.send(utils.getJSONString(replyMessage));
			})});
		}
		conn.onopen = async() => {
			conn.send(utils.getJSONString({channel,sourceId}));
		}
	};

	const clientBrowserHttpConnect = (port, host, channel)=>{
		const conn = new http();
		conn.open('POST', `http://${host}:${port}`, true);
		conn.setRequestHeader('Content-type', 'application/json');
		conn.onreadystatechange = async() => {
		    if (conn.readyState == 4 && conn.status == 200) {
		    	const receivedMessage = utils.getJSONObject(conn.responseText);
				await callbacks.every(async receive => { await receive(receivedMessage, (replyMessage)=>{
					conn.send(utils.getJSONString(replyMessage));
				})});
		    }
		};
		conn.send(utils.getJSONString({channel,sourceId}));
	};

	const clientWebSocketConnect = (port, host, channel)=>{
		const client = new websocket();
		const url = `ws://${host}:${port}`;
		client.connect(url,"echo-protocol");
		client.on('connect',async(conn) => {
			conn.on('message', async (message) => {
				if (message.type === 'utf8') {
					const receivedMessage = utils.getJSONObject(message.utf8Data);
					await callbacks.every(async receive => { await receive(receivedMessage, (replyMessage)=>{
						conn.sendUTF(utils.getJSONString(replyMessage));
					})});
				}
			});
			conn.sendUTF(utils.getJSONString({channel,sourceId}));
		});
	};

	const clientHttpConnect = (port, host, channel)=>{
			// resolve({
			// 	channel: msg.channel,
			// 	data: msg.data,
			// 	sourceId: msg.sourceId,
			// 	send: (message)=> conn.sendUTF(utils.getJSONString(message))
			// });
			// conn.send(`${sourceId}_ping`);
	};

	const createHttpServer = (port)=>{
		const httpServer = http(async(request, response) => {
			console.log("");
			let receivedMessage;
			utils.log("COMMUNICATION", `received http message from ${receivedMessage.sourceId}.`);
			await callbacks.every(async receive=> {await receive(receivedMessage, (replyMessage, statusCode, contentType)=>{
				if (response.finished === false){
					response.setHeader('Content-Type', contentType);
					response.setHeader('Content-Length',  Buffer.byteLength(replyMessage.data));
					response.writeHead(statusCode, { 'Content-Type': contentType });
					response.end(new Buffer(replyMessage.data));
				}
			})});
		});
		httpServer.listen(port);
		utils.log("COMMUNICATION", "listening on port ",port);
		return httpServer;
	}

	const createWebSocketServer = (server)=>{
		const socket=new websocket({server});
		socket.on('connection', async(conn, request) => {
			conn.on('message', async (message) => {
				if (message.type === 'utf8') {
					console.log("");
					const receivedMessage = utils.getJSONObject(message.utf8Data);
					utils.log("COMMUNICATION", `received websocket message from ${receivedMessage.sourceId}.`);
					await callbacks.every(async receive => { await receive(receivedMessage, (replyMessage)=>{
						conn.sendUTF(utils.getJSONString(replyMessage));
					})});
				}
			});
		});
	}

	this.initialise=async(host, port, channel)=>{

		const isWebSocketServer     = typeof module !== 'undefined'
									&& (websocket !== undefined && websocket !== null) 
									&& utils.getFunctionName(websocket).indexOf("SocketServer") > -1;

		const isHttpServer          = typeof module !== 'undefined'
									&& (http !== undefined || http !== null) 
									&& utils.getFunctionName(http) === "createServer" 

		const isServer = isHttpServer === true || isWebSocketServer === true;

		const isNodeWebSocketClient =   this.isServer === false
									&& typeof module !== 'undefined'
									&& (websocket !== undefined && websocket !== null) 
									&& utils.getFunctionName(websocket).indexOf("Socket") > -1;

		const isBrowserWebSocketClient = this.isServer === false
									&& typeof module === 'undefined'
									&& (websocket !== undefined && websocket !== null) 
									&& utils.getFunctionName(websocket) === "WebSocket";

		const isNodeHttpClient = 	this.isServer === false
									&& typeof module !== 'undefined'
									&& (websocket === undefined || websocket === null)
									&& (http !== undefined || http !== null);

		const isBrowserHttpClient = this.isServer === false
									typeof module === 'undefined'
									&& (websocket === undefined || websocket === null)
									&& (http !== undefined || http !== null) 
									&& utils.getFunctionName(http) === "XMLHttpb Request";

		utils.log("COMMUNICATION","Connections Info");
		utils.log("COMMUNICATION","IsWebSocketServer ",isWebSocketServer);
		utils.log("COMMUNICATION","IsHttpServer ",isHttpServer);
		utils.log("COMMUNICATION","IsNodeWebSocketClient ",isNodeWebSocketClient);
		utils.log("COMMUNICATION","IsBrowserWebSocketClient ",isBrowserWebSocketClient);
		utils.log("COMMUNICATION","IsNodeHttpClient ",isNodeHttpClient);
		utils.log("COMMUNICATION","IsBrowserHttpClient ",isBrowserHttpClient);

		if (isNodeWebSocketClient === true){
			await clientWebSocketConnect(host, port, channel);
		} else if (isBrowserWebSocketClient === true){
			await clientBrowserWebsocketConnect(host, port, channel);
		} else if (isNodeHttpClient === true) {
			await clientHttpConnect(host, port, channel);
		} else if (isBrowserHttpClient === true) {
			await clientBrowserHttpConnect(host, port, channel);
		} else if (isHttpServer === true && isWebSocketServer === false) {
			createHttpServer(port);
		} else if (isWebSocketServer === true && isHttpServer === true) {
			const httpServer = createHttpServer(port);
			createWebSocketServer(httpServer);
		}

		return {
			isServer, 
			send: async(data, statusCode, contentType)=>{
				const _channel = channel.replace(/\//g,"") || "global";
				callbacks.push(async(receivedMessage, reply)=>{
					if (receivedMessage.channel === _channel && receivedMessage.sourceId != sourceId){
						await reply(data, statusCode, contentType);
					}
				});
			},
			receive: async(callback, statusCode, contentType)=>{
				const _channel = channel.replace(/\//g,"") || "global";
				callbacks.push(async(receivedMessage)=>{
					if (receivedMessage.channel === _channel && receivedMessage.sourceId != sourceId){
						await callback(receivedMessage.data);
					}
				});
			}
		}
	}
}