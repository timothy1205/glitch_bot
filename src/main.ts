// Typescript source mapping
require("source-map-support").install();
const path = require("path");

// Setup environmental variables
require("dotenv").config({ path: path.join(path.dirname(__dirname), ".env") });

// Start chat bot client
