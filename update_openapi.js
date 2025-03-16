import { readFileSync, writeFileSync } from "fs";

// Lade die OpenAPI JSON-Datei
const openApiPath = "openapi.json";
const openApiData = JSON.parse(readFileSync(openApiPath, "utf-8"));

function addRequiredFields(schema) {
  if (schema.type === "object" && schema.properties) {
    const requiredFields = Object.keys(schema.properties).filter((prop) => {
      const property = schema.properties[prop];
      if (property.type === "object") {
        addRequiredFields(property); // Rekursive Verarbeitung
      }
      return !property.nullable;
    });

    if (requiredFields.length > 0) {
      schema.required = requiredFields;
    }
  }

  // Rekursiv durch allOf, anyOf, oneOf gehen
  ["allOf", "anyOf", "oneOf"].forEach((key) => {
    if (schema[key]) {
      schema[key].forEach(addRequiredFields);
    }
  });
}

if (openApiData.components && openApiData.components.schemas) {
  const schemas = openApiData.components.schemas;

  Object.keys(schemas).forEach((schemaName) => {
    addRequiredFields(schemas[schemaName]);
  });

  // Speichere die geänderte OpenAPI JSON-Datei
  writeFileSync(
    "openapi_updated.json",
    JSON.stringify(openApiData, null, 2),
    "utf-8"
  );
  console.log("Updated OpenAPI file saved as openapi_updated.json");
} else {
  console.log("No schemas found in components");
}
