const fs = require("fs");
const axios = require("axios");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

const inputFile = "pinocde.csv";
const outputJSON = "pincode_ids.json";
const outputCSV = "pincode_ids.csv";

const pincodes = [];

// Step 1: Read Pincodes from CSV
function readPincodes() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (row) => {
        if (row.pincode) {
          pincodes.push(row.pincode.trim());
        }
      })
      .on("end", () => {
        console.log("✅ Pincodes loaded:", pincodes.length);
        resolve();
      })
      .on("error", reject);
  });
}

// Step 2: Call API for each pincode
async function fetchPincodeId(pincode) {
  const url = `https://connectone-core-services-3x3erwhl5a-el.a.run.app/api/pincode/search/${pincode}`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      return {
        pincode,
        pincode_id: data[0].id,
      };
    } else {
      return {
        pincode,
        pincode_id: "NOT_FOUND",
      };
    }
  } catch (err) {
    console.error(`❌ Failed for ${pincode}:`, err.message);
    return {
      pincode,
      pincode_id: "ERROR",
    };
  }
}

// Step 3: Process all pincodes
async function processPincodes() {
  await readPincodes();
  const results = [];

  for (const pin of pincodes) {
    const result = await fetchPincodeId(pin);
    results.push(result);
  }

  // Write JSON
  fs.writeFileSync(outputJSON, JSON.stringify(results, null, 2));
  console.log(`✅ Saved JSON to ${outputJSON}`);

  // Write CSV
  const parser = new Parser({ fields: ["pincode", "pincode_id"] });
  const csvData = parser.parse(results);
  fs.writeFileSync(outputCSV, csvData);
  console.log(`✅ Saved CSV to ${outputCSV}`);
}

// Run it
processPincodes();
