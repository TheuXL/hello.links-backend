@echo off
wsl -d Ubuntu -e bash -c 'cd ~/link_backend/backend && PORT=8000 npx nodemon -r dotenv/config src/server.js'
