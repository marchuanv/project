const App = require('@octokit/app')
const Octokit = require('@octokit/rest')
const { lstatSync, readdirSync, appendFileSync, existsSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const owner = "marchuanv";
const privateKey = process.env.ACTIVEPROJECT.split("\\n").join("\n");

const app = new App({ id: 29633, privateKey });
const octokit = new Octokit({
  auth: () => app.getInstallationAccessToken({ installationId: 869338 })
});

octokit.repos.listForUser({
  username: owner
}).then(({ data }) => {
    for(const repoName of data.map(x=>x.name)){
        const repoFilePath = join(__dirname, repoName);
        if (existsSync(repoFilePath)===false){
            mkdirSync(repoName);
            appendFileSync('.gitignore',`\n${repoName}/`);
        }
        octokit.repos.getContents({
          owner,
          repo: repoName,
          path: ""
        }).then(async({ data }) => {
            for(const metadata of data){
                const newFilePath = join(__dirname, repoName, metadata.path);
                if (existsSync(newFilePath)===false){
                    if (metadata.type === "dir"){
                        console.log("creating directory: ",newFilePath);
                        mkdirSync(newFilePath);
                    }
                    if (metadata.type === "file"){
                        console.log("creating file: ",newFilePath);
                        const blob = await octokit.gitdata.getBlob({ owner, repo: repoName, file_sha: metadata.sha });
                        const buff = new Buffer(blob.data.content, 'base64');
                        writeFileSync(newFilePath,buff.toString('ascii'));
                    }
                }
            };
        });
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