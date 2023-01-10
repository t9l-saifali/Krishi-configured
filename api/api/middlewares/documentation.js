const fs = require("fs");
const path = require("path");

module.exports.log = async (req, res, next) => {
  let json = await fs.readFileSync(path.join(__dirname, "../documentation/api.json"));
  let arr = JSON.parse(json);
  // console.log("............", arr);

  let existing = arr.filter((item) => item.url === req.url)[0];

  let parameters = [];
  Object.keys(req.body).forEach((key) => {
    parameters.push(`${key} (${typeof req.body[key]})`);
  });

  if (existing) {
    let set = new Set(existing.parameters);
    parameters.forEach((item) => {
      set.add(item);
    });
    existing.parameters = Array.from(set);
  } else {
    arr.push({
      url: req.url,
      method: req.method,
      parameters,
    });
  }

  fs.writeFileSync(path.join(__dirname, "../documentation/api.json"), JSON.stringify(arr));

  // console.log(arr);

  next();
};
