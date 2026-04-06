# GitHub import pack for Metro Syndicate

## Keep in the repo
- frontend source
- backend source
- worker source
- Prisma schema
- shared game data
- docs
- tests
- scripts
- package manifests
- lockfiles

## Do not commit
- env files with real values
- node_modules
- build output
- cache folders
- local databases
- local Redis data
- real production credentials

## Recommended root layout
- client/
- server/
- shared/
- prisma/
- docs/
- tests/
- scripts/
- .gitignore
- .gitattributes
- .env.example
- README.md
- package.json

## Before first push
- make sure no real secrets are tracked
- rename current files to clear names like client/App.tsx and server/app.ts
- move old versions into docs/archive or remove them
- inspect git status before commit

## Basic push flow
1. initialize git if needed
2. add files
3. review tracked files
4. commit
5. connect remote
6. push main branch
