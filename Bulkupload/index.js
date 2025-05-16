const fs = require("fs");
const path = require("path");
const axios = require("axios");
const csv = require("csv-parser");

const API_URL =
  "https://connectone-core-services-2xjv57jygq-uc.a.run.app/api/pincode/add/7b9a639b-60ac-4c24-8c91-690156b73869";

const csvFiles = [
  "Data 27 - Sheet1.csv",
  "Data 28 - Sheet1.csv",
  "Data 29 - Sheet1.csv",
  "Data 30 - Sheet1.csv",
  "Data 31 - Sheet1.csv",
  "Data 32 - Sheet1.csv",
  "Data 33 - Sheet1.csv",
  "Data 34 - Sheet1.csv",
  "Data 35 - Sheet1.csv",
  "Data 36 - Sheet1.csv",
];

async function uploadCSV(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, fileName);
    const records = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Convert fields if needed, e.g., statusId to number
        records.push({
          pincode: row.pincode,
          areaName: row.areaName,
          districtId: parseInt(row.districtId, 10),
          statusId: parseInt(row.statusId, 10),
        });
      })
      .on("end", async () => {
        console.log(`Parsed ${records.length} rows from ${fileName}`);
        for (const record of records) {
          try {
            const res = await axios.post(API_URL, record);
            console.log(`✅ Uploaded: Status: ${res.status}`);
          } catch (err) {
            console.error(`❌ Failed:`, err.response?.data || err.message);
          }
        }
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function startCSVUpload() {
  for (const file of csvFiles) {
    console.log(`\n📁 Processing file: ${file}`);
    await uploadCSV(file);
  }
  console.log("\n🚀 All CSV uploads complete!");
}

startCSVUpload();
