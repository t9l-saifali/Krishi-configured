let socketio = require("socket.io");
const Whatsapp = require("./whatsapp");

let server, io;

module.exports.setServer = (s) => {
  server = s;
};

module.exports.createIo = () => {
  if (server)
    io = socketio(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  //   console.log(io);
  io.on("connection", (socket) => {
    socket.emit("connection_success", "success");
    socket.on("qr_request", async () => {
      Whatsapp.getQR(socket);
    });
    socket.on("closeSocketServer", async () => {
      console.log("socket server closed.");
      socket.disconnect();
    });
  });
};
