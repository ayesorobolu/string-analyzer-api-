import crypto from "crypto";

const stringsDB = {};

export const string = async (req, res) => {
try {
    const { value } = req.body;

     if (!req.body || !("value" in req.body)) {
      return res.status(400).json({ error: "Invalid request body or missing 'value' field" });
    }

    if (typeof value !== "string") {
      return res.status(422).json({ error: "Invalid data type for 'value' (must be a string)" });
    }

    if (stringsDB[value]) {
      return res.status(409).json({ error: "String already exists in the system" });
    }

    const sha256_hash = crypto.createHash("sha256").update(value).digest("hex");

    const length = value.length;

    const is_palindrome = value.toLowerCase() === value.toLowerCase().split("").reverse().join("");

    const unique_characters = new Set(value).size;

    const word_count = value.trim().split(/\s+/).filter(Boolean).length;

    const character_frequency_map = {};
    for (let char of value) {
      character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
    }

     const analyzedData = {
      id: sha256_hash,
      value,
      properties: {
        length,
        is_palindrome,
        unique_characters,
        word_count,
        sha256_hash,
        character_frequency_map,
      },
      created_at: new Date().toISOString(),
    };

     stringsDB[value] = analyzedData;

     res.status(201).json(analyzedData);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while analyzing string" });
  }
};

export const getString = async (req, res) => {
try {
    const { string_value } = req.params;

    const foundString = stringsDB[string_value];

    if (!foundString) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    res.status(200).json(foundString);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while retrieving the string" });
  }
};
