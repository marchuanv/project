process.files={};
const Octokit = require('@octokit/rest');

const getFileId=(fileSpec)=>{
	const path = require('path');
	return path.basename(fileSpec).replace(path.extname(fileSpec),"");
};

module.exports=async function({ gitRepositoryName, userName, token, fileSpec }) {
	if (gitRepositoryName && userName && token && fileSpec) {
		
		const expectedFileId = getFileId(fileSpec);
		
		console.log("");
		console.log("-------------------------------------------------------------------------------------------");
		console.log(`LOADING CONTENT FOR: ${fileSpec}`);
		
		let repositoryCache = process.files[gitRepositoryName];
		if (!repositoryCache){
			repositoryCache = {};
			process.files[gitRepositoryName] = repositoryCache;
		}

		if (repositoryCache[expectedFileId]){
			console.log(`getting ${gitRepositoryName} files from the cache.`);
			return repositoryCache[expectedFileId];
		} else {
			console.log(`getting ${gitRepositoryName} files from git.`);
			console.log("");
			const git = new Octokit({ userName, auth: `token ${token}`});
			let metadata = (await git.repos.getContents({ owner: userName, repo: gitRepositoryName, path: fileSpec })).data;
			if (metadata) {
				if (Array.isArray(metadata)===true) {
					throw new Error("more than one metadata record was loaded for ", fileSpec);
				}
				if (metadata.type === "dir") {
					throw new Error(`${fileSpec} is not a file.`);
				}
				const actualFileId = getFileId(metadata.path);
				if (expectedFileId === actualFileId){
					const blob = await git.gitdata.getBlob({ owner: userName, repo: gitRepositoryName, file_sha: metadata.sha });
					const buff = new Buffer(blob.data.content, 'base64');
					repositoryCache[actualFileId] = buff.toString('ascii');
					return repositoryCache[actualFileId];
				}
				throw new Error(`could not find the sha key for ${expectedFileId}`);
			}
			throw new Error(`could not find the sha key for ${expectedFileId}`);
		}
	}
	throw new Error(`invalid or missing arguments: ${JSON.stringify({ 
		gitRepositoryName: gitRepositoryName, 
		userName: userName, 
		token: token, 
		fileSpec: fileSpec 
	})}`);
};