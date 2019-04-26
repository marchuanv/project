const vm = require("vm");
module.exports=async function({ gitRepositoryName, userName, token, fileSpec, references }) {
	const content = await require("./loadgitcontent.js")({ gitRepositoryName, userName, token, fileSpec });
	return await require("./parsejavascript.js")({ content });
}