const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Load Schema
const schema = JSON.parse(fs.readFileSync("./propertySchema.json", "utf8"));

// Load Data
const data = JSON.parse(fs.readFileSync("./propertyData.json", "utf8"));

const validate = ajv.compile(schema);

let errorCount = 0;

data.forEach((property, index) => {
  const valid = validate(property);

  if (!valid) {
    console.log("!!!!INVALID PROPERTY #" + index);
    console.log("Developer:", property.developerName);
    console.log("Title:", property.title);
    console.log("Errors:");
    validate.errors.forEach(err => {
      console.log(`- ${err.instancePath} ${err.message}`);
    });
    console.log("--------------------------------------------------");
    errorCount++;
  }
});

if (errorCount === 0) {
  console.log("ALL PROPERTIES ARE VALID & PRODUCTION READY!");
} else {
  console.log(`!!!!!! ${errorCount} PROPERTIES HAVE ERRORS — FIX BEFORE IMPORTING.`);
}
// console.log(validate.errors);