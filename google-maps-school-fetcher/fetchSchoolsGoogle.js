const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const csvParser = require("csv-parser");

const GOOGLE_API_KEY = "AIzaSyAevdGYWu7_4OTd98RlBtEyH8tz9R_yUpw";
const INPUT_FOLDER = "./input";
const OUTPUT_FOLDER = "./output";

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}

// Read all CSV files from input folder
const getInputFiles = () => {
  return fs
    .readdirSync(INPUT_FOLDER)
    .filter((file) => path.extname(file).toLowerCase() === ".csv");
};

// Read single CSV
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// Google Place ID fetch
async function findPlaceId(name, district, pincode) {
  const query = `${name}, ${district}, ${pincode}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
    query
  )}&inputtype=textquery&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.candidates && response.data.candidates.length > 0) {
      return response.data.candidates[0].place_id;
    }
  } catch (error) {
    console.error(`❌ Error finding place for: ${query}`, error.message);
  }
  return null;
}

// Google Place Details fetch
async function fetchPlaceDetails(placeId) {
  const fields = "name,formatted_address,website,formatted_phone_number,url";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    if (response.data.result) {
      return response.data.result;
    }
  } catch (error) {
    console.error(
      `❌ Error fetching details for Place ID: ${placeId}`,
      error.message
    );
  }
  return {};
}

// Extract PIN from address
function extractPincode(address) {
  if (!address) return "NA";
  const match = address.match(/\b\d{5,6}\b/);
  return match ? match[0] : "NA";
}

// Process one file
async function processFile(inputFileName) {
  const inputPath = path.join(INPUT_FOLDER, inputFileName);
  const outputPath = path.join(OUTPUT_FOLDER, inputFileName);

  console.log(`📂 Processing file: ${inputFileName}`);

  const inputSchools = await readCSV(inputPath);
  const detailedSchools = [];

  for (let i = 0; i < inputSchools.length; i++) {
    const school = inputSchools[i];
    const { SchoolName, District, Pincode } = school;

    console.log(`🔍 Looking up: ${SchoolName}, ${District}, ${Pincode}`);

    const placeId = await findPlaceId(SchoolName, District, Pincode);
    if (!placeId) {
      console.log(`⚠️ Skipped: ${SchoolName}`);
      continue;
    }

    const details = await fetchPlaceDetails(placeId);
    const address = details.formatted_address || "NA";

    detailedSchools.push({
      SchoolName: details.name || "Unknown",
      Address: address,
      Pincode: extractPincode(address),
      ContactEmail: "NA",
      ContactPhone: details.formatted_phone_number || "NA",
      Website: details.website || "NA",
      GMapLink: details.url || "NA",
      PlaceID: placeId,
    });

    await new Promise((resolve) => setTimeout(resolve, 300)); // Avoid rate-limiting
  }

  // Write to output CSV
  const parser = new Parser();
  const csv = parser.parse(detailedSchools);
  fs.writeFileSync(outputPath, csv);

  console.log(`✅ Saved output: ${outputPath}`);
}

// Process all input files
async function runAll() {
  const files = getInputFiles();

  if (files.length === 0) {
    console.log("⚠️ No CSV files found in input folder.");
    return;
  }

  for (const file of files) {
    await processFile(file);
  }

  console.log("🎉 All files processed!");
}

runAll();
