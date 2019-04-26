const vm = require("vm");
module.exports=async function({ content }) {
	if (!process.parserContext){
		process.parserContext={};
	}
	try {
		const script = new vm.Script(content);
		console.log("");
		console.log("-------------------------------------------------------------------------------------------");
		console.log(`PARSING JAVASCRIPT`);
		script.runInNewContext(process.parserContext);
	} catch (err) {
		const errExt = new Error(`failed to parse script. Error ${err.message}`);
		errExt.stack = err.stack;
		throw errExt;
	}
	return process.parserContext;
}