import crypto from "crypto";

export const string = async (req, res) => {
try {
    const { value } = req.body;

    if (!value || typeof value !== "string") {
      return res.status(422).json({ error: "Please provide a valid string" });
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

    res.json({
      id: sha256_hash,
      value: value,
      properties: {
      length,
      is_palindrome,
      unique_characters,
      word_count,
      sha256_hash,
      character_frequency_map,
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while analyzing string" });
  }
};
