const { getState, sendTestMessage, resetConn } = require("../../whatsapp");
const socketModule = require("../../socket");

module.exports.startConn = (req, res) => {
  socketModule.createIo();
  res.status(200).json({ msg: "ok", data: "whatsapp connection process started !!" });
};

module.exports.checkStatus = async (req, res) => {
  let state = await getState();
  return res.status(200).json({ msg: "ok", data: state, code: 0 });
};

module.exports.sendMsg = async (req, res) => {
  sendTestMessage();
  return res.status(200).json({ msg: "ok", data: "Sent", code: 0 });
};

module.exports.stopConn = async (req, res) => {
  let logout = req.body && req.body.logout;
  await resetConn(logout);
  return res
    .status(200)
    .json({ msg: "ok", data: logout ? "Whatsapp user logged out and connection closed." : "Whatsapp connection closed.", code: 0 });
};
