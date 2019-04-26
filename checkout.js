const App = require('@octokit/app')
const Octokit = require('@octokit/rest')
const { lstatSync, readdirSync, appendFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

const owner = "marchuanv";
const privateKey = process.env.ACTIVEPROJECT.split("\\n").join("\n");

const app = new App({ id: 29633, privateKey });
const octokit = new Octokit({
  auth: () => app.getInstallationAccessToken({ installationId: 869338 })
});

const gitIgnorePath = join(__dirname,".gitignore");
const gitIgnoreContent = readFileSync(gitIgnorePath,"utf8")

const downloadFiles=(owner, repo, path)=>{
    octokit.repos.getContents({ owner, repo, path}).then(async({ data }) => {
        for(const metadata of data){
            const newFilePath = join(__dirname, repo, metadata.path);
            if (existsSync(newFilePath)===false){
                if (metadata.type === "dir"){
                    console.log("creating directory: ",newFilePath);
                    mkdirSync(newFilePath);
                    downloadFiles(owner, repo, metadata.path);
                }
                if (metadata.type === "file"){
                    console.log("creating file: ",newFilePath);
                    const blob = await octokit.gitdata.getBlob({ owner, repo, file_sha: metadata.sha });
                    const buff = new Buffer(blob.data.content, 'base64');
                    writeFileSync(newFilePath,buff.toString('ascii'));
                }
            }
        };
    });
};

octokit.repos.listForUser({
  username: owner
}).then(({ data }) => {
    for(const repoName of data.map(x=>x.name)){
        if (existsSync(join(__dirname, repoName))===false){
            mkdirSync(repoName);
            const ignorePhrase=`\n${repoName}/`;
            if (gitIgnoreContent.indexOf(ignorePhrase)===-1) {
                appendFileSync(gitIgnorePath, ignorePhrase);
            }
        }
        downloadFiles(owner, repoName, "");
    };
});

// octokit.repos.createFile({
//     owner: "marchuanv",
//     repo: "project",
//     path:  "lib/test.js",
//     branch:"master",
//     message: 'This is a test',
//     content: "TEST",//new Buffer(fs.createReadStream(path.join(__dirname,'test.js'))).toString('base64'), 
//     author: {
//         "name": "marchuan van der merwe",
//         "email": "marchuanv@gmail.com"
//     }
// }).then((response)=>{
// 	console.log(response);
// })