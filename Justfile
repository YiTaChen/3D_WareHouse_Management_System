default:
    just --list

setup:
    npm run setup:all

dev:
    npm run dev:all

frontend:
    npm run dev:frontend

backend:
    npm run dev:backend

reset-demo:
    npm --prefix backend run reset:demo
