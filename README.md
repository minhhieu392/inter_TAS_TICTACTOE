

## Run app
```
yarn install
yarn local-test
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

