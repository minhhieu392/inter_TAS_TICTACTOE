## Description:
nhap username => findroom
-neu tim thay nguoi choi phu hop => choi dong bo => matching 2 player => save info game into database => ket qua (thang/thua/hoa) => tinh diem => update diem cho nguoi choi => update game info
-sau 5s (khong tim thay nguoi choi phu hop) => choi bat dong bo => save info game into database => ket qua (thang/thua/hoa) => tim kiem nguoi choi bat dong bo trong vong 7 ngay tinh tu thoi diem hien tai(co cung game type) => 
+ neu tim thay nguoi choi phu hop => so sanh ket qua 2 nguoi choi => tinh diem => update diem cho 2 nguoi choi => update game info => xoa nguoi choi khoi danh sach nguoi choi bat dong bo.
+ neu khong tim thay nguoi choi phu hop => save thong tin nguoi choi (user, game, score) vao danh sach nguoi choi bat dong bo

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


run docker-compose up -d

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

