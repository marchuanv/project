reset

git pull origin master
npm install
npm update
npm run minify
git add -A
git commit -m "fix"
git push origin master

npm start