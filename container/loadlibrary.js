const path = require('path');
process.libraries={};

async function getFunctions(library){
	let functions = [];
	for(const key of Object.keys(library)){
		if (library[key] && typeof library[key] === "object"){
			const funcs = await getFunctions(library[key]);
			functions = functions.concat(funcs);
		} else if (library[key] && typeof library[key] === "function") {
			functions.push({
				name: key,
				value: library[key]
			});
		}
	};

	return functions;
};

async function loadLibrary({ moduleName, userName, token }) {

	let moduleLib = process.libraries[moduleName];
	if (!moduleLib){
		process.libraries[moduleName]={};
		moduleLib = process.libraries[moduleName];
	}

	const packageContent = await require("./loadgitcontent.js")({
		gitRepositoryName: moduleName,
		userName,
		token,
		fileSpec: "package.json"
	});

	const remoteNodePackage = JSON.parse(packageContent);
	const remoteGitRepositoryName = path.basename(remoteNodePackage.repository.url)
										.replace(path.extname(remoteNodePackage.repository.url),"");

	console.log("");
	console.log("-------------------------------------------------------------------------------------------");
	console.log(`LOADING LIBRARY FROM: ${JSON.stringify(remoteGitRepositoryName)}`);
	
	const javascriptFileIds = Object.keys(remoteNodePackage.files).filter(key => remoteNodePackage.files[key].endsWith(".js"));
	const otherFileIds = Object.keys(remoteNodePackage.files).filter(key => remoteNodePackage.files[key].endsWith(".js")===false);

	if (remoteNodePackage.dependencies){
		
		const libraries = Object.keys(remoteNodePackage.dependencies).filter((key)=>remoteNodePackage.dependencies[key].startsWith("git+"));
		console.log("");
		console.log("-------------------------------------------------------------------------------------------");
		console.log(`LOADING LIBRARY DEPENDENCIES FIRST: ${JSON.stringify(libraries)}`);

		for(const libName of libraries){
			const depModuleLibrary = await loadLibrary({ moduleName: libName, userName, token });
			for (const key of Object.keys(depModuleLibrary)){
				moduleLib[key] = depModuleLibrary[key];
			};
		};
	}

	let moduleScript=moduleLib[moduleName] || "";
	for(const jsFileId of javascriptFileIds){
		const jsfileSpec = remoteNodePackage.files[jsFileId];
		const content = await require("./parsegitjavascriptfile.js")({ 
			gitRepositoryName: remoteGitRepositoryName,
			userName: remoteNodePackage.username,
			token, 
			fileSpec: jsfileSpec
		});
		moduleScript = `${moduleScript}\r\n${content.toString()}`;
	};
	const script = await require("./parsejavascript.js")({ fileSpec: moduleName, moduleScript });
	for (const key of Object.keys(script)){
		moduleLib[key] = script[key];
	};

	for(const otherFileId of otherFileIds){
		const otherFileSpec = remoteNodePackage.files[otherFileId];
		const content = await require("./loadgitcontent.js")({ 
			gitRepositoryName: remoteGitRepositoryName,
			userName: remoteNodePackage.username,
			token,
			fileSpec: otherFileSpec
		});
		if (path.extname(otherFileSpec)===".json"){
			moduleLib[otherFileId] = JSON.parse(content);
		} else {
			moduleLib[otherFileId] = content;
		}
	};

	return moduleLib;
};

module.exports=async function({ moduleName, userName, token }) {
	process.parserContext = { console, Buffer, setTimeout, setInterval, clearInterval, module, require };
	return await loadLibrary({ moduleName, userName, token });
}