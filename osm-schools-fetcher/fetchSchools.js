const axios = require("axios");
const fs = require("fs");
const { Parser } = require("json2csv");
const csvParser = require("csv-parser");

// CHANGE THESE
const districtName = "Thrissur"; // district to search in
const inputSchoolCSV = "my_schools.csv"; // your known schools
const outputMatchedCSV = "matched_schools.csv";

// Step 1: Read input CSV with your known schools
async function readMySchoolList() {
  return new Promise((resolve, reject) => {
    const schools = [];
    fs.createReadStream(inputSchoolCSV)
      .pipe(csvParser())
      .on("data", (row) => {
        if (row.SchoolName) {
          schools.push(row.SchoolName.trim().toLowerCase());
        }
      })
      .on("end", () => resolve(schools))
      .on("error", reject);
  });
}

// Step 2: Get Bounding Box from Nominatim API
async function getBoundingBox(district) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    district
  )}`;

  const response = await axios.get(url, {
    headers: { "User-Agent": "OSM-School-Fetcher-App" },
  });

  if (response.data.length === 0) {
    throw new Error("District not found in Nominatim API.");
  }

  const bbox = response.data[0].boundingbox;
  return {
    south: bbox[0],
    north: bbox[1],
    west: bbox[2],
    east: bbox[3],
  };
}

// Step 3: Fetch all schools from OSM using Overpass API
async function fetchSchools(bbox) {
  const query = `
[out:json][timeout:60];
(
  node["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  relation["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out center tags;
`;

  const response = await axios.post(
    "https://overpass-api.de/api/interpreter",
    `data=${encodeURIComponent(query)}`,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const elements = response.data.elements;

  return elements.map((element) => {
    const lat = element.lat || element.center?.lat || "NA";
    const lon = element.lon || element.center?.lon || "NA";
    return {
      name: element.tags?.name?.trim() || "Unknown",
      latitude: lat,
      longitude: lon,
      google_maps_link:
        lat !== "NA" && lon !== "NA"
          ? `https://www.google.com/maps?q=${lat},${lon}`
          : "NA",
    };
  });
}

// Step 4: Match your list with fetched schools
function matchSchools(mySchools, fetchedSchools) {
  const matches = [];

  for (const mySchool of mySchools) {
    const matched = fetchedSchools.find((school) =>
      school.name.toLowerCase().includes(mySchool)
    );

    if (matched) {
      matches.push({
        SchoolName: matched.name,
        Latitude: matched.latitude,
        Longitude: matched.longitude,
        GoogleMapsLink: matched.google_maps_link,
      });
    }
  }

  return matches;
}

// Step 5: Run everything
async function run() {
  try {
    console.log(`🔍 Reading your school list...`);
    const mySchools = await readMySchoolList();

    console.log(`📍 Fetching OSM data for: ${districtName}`);
    const bbox = await getBoundingBox(districtName);
    const osmSchools = await fetchSchools(bbox);

    console.log(`🔗 Matching with your list...`);
    const matched = matchSchools(mySchools, osmSchools);

    // Save output
    const parser = new Parser();
    const csv = parser.parse(matched);
    fs.writeFileSync(outputMatchedCSV, csv);

    console.log(
      `✅ Matched ${matched.length} schools! Saved to ${outputMatchedCSV}`
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

run();
