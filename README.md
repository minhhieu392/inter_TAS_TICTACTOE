

## Run app

```
add file .env:
DATABASE_PORT=6700
POSTGRES_PASSWORD=password123
POSTGRES_USER=postgres
POSTGRES_DB=tictactoe_game
POSTGRES_HOST=postgres
POSTGRES_HOSTNAME=127.0.0.1
DATABASE_URL="postgresql://postgres:password123@localhost:6700/tictactoe_game?schema=public"


run docker compose up
yarn install
yarn local-tas
run client.html
```

## Build number
### Before commit please run 1 of below
```
npm run version-patch
npm run version-minor
npm run version-major
```

## Check version 
After Jenkin build check 
- {{url}}/status

## Using docker-compose
- docker-compose -f docker-compose.yaml build
- docker-compose -f docker-compose.yaml up -d

## Run redis by docker on window
- link download: https://docs.docker.com/desktop/windows/install/
- require install Linux Keenel, visit link: https://docs.microsoft.com/en-us/windows/wsl/install-manual#step-4---download-the-linux-kernel-update-package
- run "docker run -d --name redis -p 6379:6379 redis" on docker

## Integration Test
- Write test for each new feature

