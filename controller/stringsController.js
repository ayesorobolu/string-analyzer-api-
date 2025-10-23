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

// Natural Language Parser with conflict detection
const parseNaturalLanguageQuery = (query) => {
  const filters = {};
  const lowerQuery = query.toLowerCase().trim();

  // Word count patterns - collect ALL matches to detect conflicts
  const wordCountPatterns = {
    'single word': 1, 'one word': 1,
    'two word': 2, 'two words': 2,
    'three word': 3, 'three words': 3, 
    'four word': 4, 'four words': 4,
    'five word': 5, 'five words': 5,
  };

  const foundWordCounts = [];
  
  // Find ALL word count mentions
  for (const [pattern, count] of Object.entries(wordCountPatterns)) {
    if (lowerQuery.includes(pattern)) {
      foundWordCounts.push(count);
    }
  }

  // Detect word count conflicts
  if (foundWordCounts.length > 1) {
    const uniqueCounts = [...new Set(foundWordCounts)];
    if (uniqueCounts.length > 1) {
      // CONFLICT: Multiple different word counts found
      filters.has_word_count_conflict = true;
    } else {
      // Same word count mentioned multiple times, use it
      filters.word_count = foundWordCounts[0];
    }
  } else if (foundWordCounts.length === 1) {
    // Only one word count found, use it
    filters.word_count = foundWordCounts[0];
  }

  // Length filters - FIXED to detect conflicts
  const longerThanMatch = lowerQuery.match(/(?:longer than|greater than|more than)\s+(\d+)\s+characters?/);
  const shorterThanMatch = lowerQuery.match(/(?:shorter than|less than|fewer than)\s+(\d+)\s+characters?/);
  const atLeastMatch = lowerQuery.match(/at least (\d+)\s+characters?/);
  const atMostMatch = lowerQuery.match(/at most (\d+)\s+characters?/);

  if (longerThanMatch) {
    filters.min_length = parseInt(longerThanMatch[1]) + 1;
  }
  if (atLeastMatch) {
    filters.min_length = parseInt(atLeastMatch[1]);
  }
  
  if (shorterThanMatch) {
    filters.max_length = parseInt(shorterThanMatch[1]) - 1;
  }
  if (atMostMatch) {
    filters.max_length = parseInt(atMostMatch[1]);
  }

  // Check for length conflicts in the parser itself
  if (filters.min_length !== undefined && filters.max_length !== undefined) {
    if (filters.min_length > filters.max_length) {
      filters.has_length_conflict = true;
    }
  }

  // Pattern 2: Palindrome - "palindrome", "palindromic"
  if (lowerQuery.includes('palindrome') || lowerQuery.includes('palindromic')) {
    filters.is_palindrome = true;
  }

  // Pattern 4: Contains character - multiple patterns
  const containsLetterMatch = lowerQuery.match(/contain(?:s)?\s+(?:the\s+)?letter\s+([a-z])/);
  if (containsLetterMatch) {
    filters.contains_character = containsLetterMatch[1];
  }

  const withLetterMatch = lowerQuery.match(/with\s+(?:the\s+)?letter\s+([a-z])/);
  if (withLetterMatch && !filters.contains_character) {
    filters.contains_character = withLetterMatch[1];
  }

  const containingMatch = lowerQuery.match(/containing\s+(?:the\s+)?letter\s+([a-z])/);
  if (containingMatch && !filters.contains_character) {
    filters.contains_character = containingMatch[1];
  }

  // Simple pattern for "strings containing z"
  const simpleContainsMatch = lowerQuery.match(/containing\s+([a-z])(?:\s|$)/);
  if (simpleContainsMatch && !filters.contains_character) {
    filters.contains_character = simpleContainsMatch[1];
  }

  // Pattern 5: "first vowel" = 'a', "second vowel" = 'e', etc.
  const vowelMap = {
    'first vowel': 'a',
    'second vowel': 'e', 
    'third vowel': 'i',
    'fourth vowel': 'o',
    'fifth vowel': 'u'
  };

  for (const [pattern, vowel] of Object.entries(vowelMap)) {
    if (lowerQuery.includes(pattern)) {
      filters.contains_character = vowel;
      break;
    }
  }

  return filters;
};

// Natural Language Filtering with conflict detection
export const filterByNaturalLanguage = async (req, res) => {
  try {
    const naturalQuery = req.query.query;

    if (!naturalQuery) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Unable to parse natural language query'
      });
    }

    const parsedFilters = parseNaturalLanguageQuery(naturalQuery);

    if (Object.keys(parsedFilters).length === 0) {
      return res.status(400).json({
        error: 'Bad Request', 
        message: 'Unable to parse natural language query'
      });
    }

    // Check for word count conflicts FIRST
    if (parsedFilters.has_word_count_conflict) {
      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: 'Query parsed but resulted in conflicting filters'
      });
    }

    // Check for length conflicts SECOND
    if (parsedFilters.has_length_conflict) {
      return res.status(422).json({
        error: 'Unprocessable Entity', 
        message: 'Query parsed but resulted in conflicting filters'
      });
    }

    // Get all strings and apply filters
    const allStrings = Object.values(stringsDB);
    const filteredStrings = allStrings.filter(str => {
      if (parsedFilters.word_count !== undefined && 
          str.properties.word_count !== parsedFilters.word_count) {
        return false;
      }
      if (parsedFilters.is_palindrome !== undefined && 
          str.properties.is_palindrome !== parsedFilters.is_palindrome) {
        return false;
      }
      if (parsedFilters.min_length !== undefined && 
          str.properties.length < parsedFilters.min_length) {
        return false;
      }
      if (parsedFilters.max_length !== undefined && 
          str.properties.length > parsedFilters.max_length) {
        return false;
      }
      if (parsedFilters.contains_character !== undefined && 
          !str.value.toLowerCase().includes(parsedFilters.contains_character.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Handle empty results
    if (filteredStrings.length === 0) {
      return res.status(200).json({
        message: "No strings match the interpreted filters",
        interpreted_query: {
          original: naturalQuery,
          parsed_filters: parsedFilters
        }
      });
    }

    return res.status(200).json({
      data: filteredStrings,
      count: filteredStrings.length,
      interpreted_query: {
        original: naturalQuery,
        parsed_filters: parsedFilters
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred while filtering strings" });
  }
};