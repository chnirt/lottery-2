console.log("Hello CodeSandbox");

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cheerio = require("cheerio");
const moment = require("moment");
const bodyParser = require("body-parser");
const cors = require("cors");

app.set("json spaces", 2);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());

// This function keeps the casing unchanged for str, then perform the conversion
function toNonAccentVietnamese(str) {
  str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/đ/g, "d");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  return str;
}

app.get("/", async (req, res) => {
  const today = new Date()
    .toISOString()
    .split("T")[0]
    .split("-")
    .reverse()
    .join("-");
  let date = today;
  const isCorrectDate = moment(req.query.date, "DD-MM-YYYY", true).isValid();
  if (isCorrectDate) {
    date = req.query.date;
  }
  const response = await fetch(
    `https://www.minhngoc.com.vn/ket-qua-xo-so/mien-nam/${date}.html`,
  );
  const html = await response.text();

  const $ = cheerio.load(html);
  const result = [];

  $("table.bkqmiennam")
    .find("table")
    .each((row, elem) => {
      $(elem)
        .find(".rightcl")
        .each((idx, elem) => {
          //   if (row !== 1) {
          //     return;
          //   }
          const rowData = {};
          const prize6 = [];
          const prize4 = [];
          const prize3 = [];
          $(elem)
            .find("td > *")
            .each((idx2, elem) => {
              const value = $(elem).text().trim();
              //   console.log(row, idx, idx2, value);
              switch (idx2) {
                case 0:
                  rowData["name"] = value;
                  if (value?.length) {
                    rowData["code"] = String(toNonAccentVietnamese(value))
                      .split(" ")
                      .map((text) => String(text).charAt(0))
                      .join("");
                  }
                  break;
                case 1:
                  rowData["8thPrize"] = value;
                  break;
                case 2:
                  rowData["7thPrize"] = value;
                  break;
                case 3:
                case 4:
                case 5:
                  prize6.push(value);
                  rowData["6thPrize"] = prize6;
                  break;
                case 6:
                  rowData["5thPrizes"] = value;
                  break;
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                  prize4.push(value);
                  rowData["4thPrize"] = prize4;
                  break;
                case 14:
                case 15:
                  prize3.push(value);
                  rowData["3rdPrize"] = prize3;
                  break;
                case 16:
                  rowData["2ndPrize"] = value;
                  break;
                case 17:
                  rowData["1stPrize"] = value;
                  break;
                case 18:
                  rowData["specialPrize"] = value;
                  break;
                default:
                  break;
              }
            });
          result.push(rowData);
        });
    });
  //   console.log(result);
  const filteredResult = result.filter((item) =>
    ["Đồng Nai", "Cần Thơ", "Sóc Trăng"].includes(item.name),
  );
  res.json(filteredResult);
});

app.get("/sample", async (req, res) => {
  const response = await fetch(
    "https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population",
  );
  const html = await response.text();
  console.log(html);

  const $ = cheerio.load(html);
  const result = [];
  $("table.wikitable")
    .find("tr")
    .each((row, elem) => {
      if (row === 0) {
        return;
      }
      const rowData = {};
      $(elem)
        .find("th,td")
        .each((idx, elem) => {
          const value = $(elem).text().trim();
          switch (idx) {
            default:
              break;
          }
          console.log(row, idx, value);
        });
      result.push(rowData);
    });
  console.log(result);
  res.json(result);
});

try {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (err) {
  console.log(err);
  console.log(err.stack);
}
