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

export const getStringByValue = async (req, res) => {
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

export const deleteString = async (req, res) => {
  try {
    const { string_value } = req.params;

    const foundString = stringsDB[string_value];

    if (!foundString) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    delete stringsDB[string_value];

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting the string" });
  }
};

export const getAllStrings = async (req, res) => {
  try {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

    const filters = {
      is_palindrome:
        is_palindrome?.toLowerCase() === "true"
          ? true
          : is_palindrome?.toLowerCase() === "false"
          ? false
          : null,
      min_length: min_length ? parseInt(min_length, 10) : null,
      max_length: max_length ? parseInt(max_length, 10) : null,
      word_count: word_count ? parseInt(word_count, 10) : null,
      contains_character: contains_character || null,
    };

    const invalid =
      (is_palindrome && !["true", "false"].includes(is_palindrome.toLowerCase())) ||
      (min_length && isNaN(filters.min_length)) ||
      (max_length && isNaN(filters.max_length)) ||
      (word_count && isNaN(filters.word_count));

    if (invalid) {
      return res.status(400).json({ error: "Invalid query parameter values or types" });
    }

    const allStrings = Object.values(stringsDB);

    const filtered = allStrings.filter((item) => applyFilters(item, filters));

    res.status(200).json({
      data: filtered,
      count: filtered.length,
      filters_applied: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== null)
      ),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching strings" });
  }
};

function applyFilters(item, filters) {
  const props = item.properties;
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = filters;

  if (is_palindrome !== null && props.is_palindrome !== is_palindrome) return false;
  if (min_length !== null && props.length < min_length) return false;
  if (max_length !== null && props.length > max_length) return false;
  if (word_count !== null && props.word_count !== word_count) return false;
  if (contains_character && !item.value.includes(contains_character)) return false;

  return true;
}