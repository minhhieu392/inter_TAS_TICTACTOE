// const WebSocket = require('ws');

// const socketEndpoint = 'ws://localhost:8080';

// const ws = new WebSocket('ws://localhost:8080');
// const ws = new WebSocket('ws://18.141.169.208:8086');

// // Add a connect listener
// ws.on('open', async function open() {
//   //console.log(113, '123456');
//   //ws.send('something');
// });

const protobuf = require("protobufjs");
const redis = require("redis");

async function testfun() {
  const redisClient = redis.createClient({
    url: "redis://:redisPassword@192.168.2.68:6379",
  });
  await redisClient.connect();
  const a = await redisClient.hGet(
    "create_token_14c2a8b430ea6589fd97a70bb8c33d90e2c1af40c98278f3c3835bf5a3e563ea",
    "deviceId"
  );
  console.log(a);
}

// testfun();

const catchAsync = async (promise) => {
  return promise.then((data) => [null, data]).catch((err) => [err]);
};

const encodeMessage = async (payload, filePath, packageType) => {
  try {
    const root = await protobuf.load(filePath);
    const testMessage = root.lookupType(packageType);
    const message = testMessage.create(payload);
    return testMessage.encode(message).finish();
  } catch (error) {
    console.log(`[encodeMessage] issue: ${error}`);
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, "Can not encrypt message");
  }
};

const decodeMessage = async (buffer, filePath, packageType) => {
  try {
    console.log("buf", buffer);
    const root = await protobuf.load(filePath);
    const testMessage = root.lookupType(packageType);
    testMessage.verify(buffer);
    const message = testMessage.decode(buffer);
    console.log("decode", message);

    return testMessage.toObject(message);
  } catch (error) {
    console.log(`[decodeMessage] issue: ${error}`);
    throw new ApiError(httpStatus.BAD_REQUEST, "Can not decode message");
  }
};

async function test() {
  // // Finding room
  // const payloadData = {
  //   userCodeId: '23f11630827f18e0781431534140465e_1677928900536',
  //   ccData: {
  //     miniGameEventId: 222,
  //     token: 'create_token_c405a57714e888b441eefa2d8cf2b76b5c7285613d303ac8f2fb00499cc8941c',
  //   }
  // };
  // const [errorDataEn, payloadDataEn] = await catchAsync(encodeMessage(payloadData, './grpc/package.proto', 'hcGames.FindingRoom'));

  // const payload = {
  //   header: 1,
  //   data: payloadDataEn
  // }
  // const [error, payloadEn] = await catchAsync(encodeMessage(payload, './grpc/package.proto', 'hcGames.PackageData'));

  // // Game puzzle
  // const payloadData = {
  //   score: 1000,
  //   clearBoard: 83,
  //   timeBonus: 83,
  //   finalScores: 1081,
  //   gameOverType: 1
  // };
  // const [errorDataEn, payloadDataEn] = await catchAsync(encodeMessage(payloadData, './grpc/package.proto', 'hcGames.BubbleShooterEndGame'));

  // const payload = {
  //   header: 8005,
  //   data: payloadDataEn
  // }
  // const [error, payloadEn] = await catchAsync(encodeMessage(payload, './grpc/package.proto', 'hcGames.PackageData'));

  // const str = "08 C4 3E 12 02 08 64";
  // const arr = str.split(" ").map((hex) => parseInt(hex, 16));
  // const buf = Buffer.from(arr);
  // const test = await catchAsync(
  //   decodeMessage(buf, "./grpc/package.proto", "hcGames.PackageData")
  // );
  // const data = "08 64";
  // const arrData = data.split(" ").map((hex) => parseInt(hex, 16));
  // const bufData = Buffer.from(arrData);
  // const testData = await catchAsync(
  //   decodeMessage(
  //     bufData,
  //     "./grpc/bubble_shooter.proto",
  //     "BubbleShooter.UpdatePoints"
  //   )
  // );
  // console.log(testData);

  // Game bubble shooter
  // const payloadData = {
  //   type: 3,
  //   points: 300,
  // };
  // const [errorDataEn, payloadDataEn] = await catchAsync(encodeMessage(payloadData, './src/network/grpc/package.proto', 'hcGames.BubbleShooterAction'));

  // const payload = {
  //   header: 8001,
  // }
  // const [error, payloadEn] = await catchAsync(encodeMessage(payload, './grpc/package.proto', 'hcGames.PackageData'));

  // const payloadData = {
  //   token: "abc",
  //   deviceId: "abc",
  //   email: "abc"
  // };
  // const [errorDataEn, payloadDataEn] = await catchAsync(encodeMessage(payloadData, './src/network/grpc/bonusgameplay.proto', 'BonusGamePlay.UserInfo'));

  const payloadData = {};

  const [errorDataEn, payloadDataEn] = await catchAsync(
    encodeMessage(
      payloadData,
      "./src/network/grpc/tic_tac_toe.proto",
      "tic_tac_toe.Player"
    )
  );
  console.log("payloadDataEn", payloadDataEn);
  const payload = {
    header: 12,
    data: payloadDataEn,
  };
  const [error, payloadEn] = await catchAsync(
    encodeMessage(
      payload,
      "./src/network/grpc/package.proto",
      "hcGames.PackageData"
    )
  );
  console.log("payloadEn", payloadEn);
  // const payloadData = {
  //   player: [
  //     {
  //       id: "hieu888",
  //       symbol: "x",
  //       isTurn: true,
  //       wins: 0,
  //       lost: 0,
  //     },
  //   ],
  //   roomId: "hieu56677",
  //   to: 7,
  // };
  // const [errorDataEn, payloadDataEn] = await catchAsync(
  //   encodeMessage(
  //     payloadData,
  //     "./src/network/grpc/tic_tac_toe.proto",
  //     "tic_tac_toe.Action"
  //   )
  // );
  // console.log("payloadDataEn", payloadDataEn);
  // const payload = {
  //   header: 9003,
  //   data: payloadDataEn,
  // };
  // const [error, payloadEn] = await catchAsync(
  //   encodeMessage(
  //     payload,
  //     "./src/network/grpc/package.proto",
  //     "hcGames.PackageData"
  //   )
  // );

  // console.log("payloadEn", payloadEn);
  // const test = await catchAsync(
  //   decodeMessage(
  //     payloadEn,
  //     "./src/network/grpc/package.proto",
  //     "hcGames.PackageData"
  //   )
  // );
  // console.log("test", test);
  // const result = [];
  // function* hexFormatValues(buffer) {
  //   for (let x of buffer) {
  //     const hex = x.toString(16)
  //     yield hex.padStart(2, '0')
  //   }
  // }

  // for (let hex of hexFormatValues(payloadEn)) {
  //   result.push(hex);
  // }

  // console.log(result.join(" "));
  // ws.send(payloadEn);
}

test();
