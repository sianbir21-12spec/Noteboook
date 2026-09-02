const BAD_WORDS = [
  'bad', 'worse', 'stupid', 'dumb', 'idiot', 'hate', 'damn', 'hell', 'crap', 'fool',
]

function normalizeForMatch(text) {
  return text.toLowerCase().replace(/[^a-z]/g, '')
}

function sanitizeMessage(text) {
  if (!text) return text
  let result = text
  for (const word of BAD_WORDS) {
    const pattern = word.split('').map((ch) => ch + '[^a-z]*').join('')
    const regex = new RegExp(pattern, 'gi')
    result = result.replace(regex, (match) => '*'.repeat(match.length))
  }
  return result
}

export { BAD_WORDS, sanitizeMessage }
