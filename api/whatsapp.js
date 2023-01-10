// const fs = require("fs");
// const Path = require("path");

// const { Client } = require("whatsapp-web.js");
// let client, socket;

// module.exports.getQR = (s) => {
//   socket = s;
//   client = new Client({
//     puppeteer: {
//       executablePath: "/usr/bin/google-chrome-stable",
//       args: ["--no-sandbox"],
//     },
//   });
//   console.log("INN HEREEEEE");
//   client.on("qr", (qr) => {
//     // Generate and scan this code with your phone
//     // console.log("QR RECEIVED", qr);
//     socket.emit("qr", qr);
//   });

//   client.on("ready", () => {
//     console.log("Client is ready!");
//     socket.emit("whatsapp_connection_success");
//   });

//   client.on("message", (msg) => {
//     if (msg.body == "!ping") {
//       msg.reply("pong");
//     }
//   });

//   client.on("disconnected", (reason) => {
//     if (reason == "NAVIGATION") {
//       module.exports.resetConn();
//     }
//   });

//   client.initialize();
// };

// module.exports.getState = async () => {
//   let state = "offline";
//   if (client) {
//     // console.log(client, "ClientClientClientClientClientClientClient");
//     try {
//       state = await client.getState();
//     } catch (err) {
//       console.log("errorrrrr:::: ", err);
//     }
//   }
//   return new Promise((resolve, reject) => {
//     resolve(state);
//   });
// };

// module.exports.sendTestMessage = async () => {
//   if (client) {
//     await client.sendMessage("919911431099@c.us", "HI! test message, pls ignore");
//   }
// };

// module.exports.sendWhatsappMessage = async (mobile, msg) => {
//   console.log(`sending msg ::::: ${msg} to ${mobile}`);
//   await client.sendMessage(`91${mobile}@c.us`, msg);
// };

// module.exports.resetConn = async () => {
//   let path = Path.resolve(__dirname, "WWebJS");
//   if (fs.existsSync(path)) {
//     await fs.rmSync(path, { recursive: true });
//   }
//   if (client) {
//     await client.destroy();
//     client = null;
//   }
// };
