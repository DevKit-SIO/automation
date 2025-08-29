import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { get, set } from "lodash-es";
import type { Category, Workflow } from "../src/_models";

type TranslateConfig = {
  modelName?: string;
  entryLocale?: string;
  selectors?: string[];
};

const defaultConfig: Required<TranslateConfig> = {
  modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
  entryLocale: process.env.ENTRY_LOCALE || "en-US",
  selectors: [
    "name", // The workflow name
    "description", // The workflow description
    "categories[].name", // Category names in the categories array
    "nodes[].defaults.name", // Node default names
    "nodes[].defaults.content", // Node default content (for sticky notes)
  ],
};

const model = new ChatOpenAI({
  temperature: 0,
  model: defaultConfig.modelName,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: process.env.OPENAI_PROXY_URL },
});

// Helper function to extract values using selectors
const extractValues = (
  obj: any,
  selectors: string[]
): { path: string; value: string }[] => {
  const values: { path: string; value: string }[] = [];

  selectors.forEach((selector) => {
    if (selector.includes("[]")) {
      // Handle array selectors like 'categories[].name'
      const parts = selector.split("[]");
      const arrayPath = parts[0] || "";
      const fieldPath = parts[1] || "";
      const array = get(obj, arrayPath);

      if (Array.isArray(array)) {
        array.forEach((item, index) => {
          const fullPath = `${arrayPath}[${index}]${fieldPath}`;
          const value = get(obj, fullPath);
          if (typeof value === "string" && value.trim()) {
            values.push({ path: fullPath, value });
          }
        });
      }
    } else {
      // Handle simple selectors
      const value = get(obj, selector);
      if (typeof value === "string" && value.trim()) {
        values.push({ path: selector, value });
      }
    }
  });

  return values;
};

// Helper function to apply translated values back to the object
const applyTranslations = (
  obj: Workflow | Array<Category>,
  translations: Array<{ path: string; value: string }>
): Workflow | Array<Category> => {
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone

  translations.forEach(({ path, value }) => {
    set(result, path, value);
  });

  return result;
};

export const translateJSON = async (
  json: Workflow | Array<Category>,
  outputLocale: string,
  entryLocale: string = defaultConfig.entryLocale,
  selectors: string[] = defaultConfig.selectors
): Promise<Workflow | Array<Category>> => {
  console.info(`i18n translating → ${entryLocale} → ${outputLocale}`);

  // Extract values to translate
  const valuesToTranslate = extractValues(json, selectors);

  if (valuesToTranslate.length === 0) {
    console.info("No translatable values found");
    return json;
  }

  // Create a simple object for translation
  const translationObject: Record<string, string> = {};
  valuesToTranslate.forEach(({ path, value }) => {
    translationObject[path] = value;
  });

  const res = await model.call(
    [
      new SystemMessage(
        [
          `You will receive a JSON object with paths and their corresponding text values. Translate all text values from ${entryLocale} to ${outputLocale} using BCP 47 standards.`,
          `Do not change the paths/keys. Only translate the string values. Return valid JSON only.`,
          `Preserve any markdown formatting, HTML tags, or special characters in the text.`,
        ].join("\n")
      ),
      new HumanMessage(JSON.stringify(translationObject)),
    ],
    {
      response_format: { type: "json_object" },
    }
  );

  const translatedValues = JSON.parse(res.content as string);

  // Convert back to array format and apply translations
  const translations = Object.entries(translatedValues).map(
    ([path, value]) => ({
      path,
      value: value as string,
    })
  );

  return applyTranslations(json, translations);
};
