@echo off
cd %~dp0
set PORT=8000
nodemon -r dotenv/config src/server.js
