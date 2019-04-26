git pull origin master
git add -A
git commit -m "fix"
git push origin master
git clean -fdx
npm install
npm update