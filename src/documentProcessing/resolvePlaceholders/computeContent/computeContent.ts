import dot from './dot'
import pipe from './pipe'
import { Placeholder, ContentPlaceholder, Formatters } from '../../types'

const DEFAULT_FALLBACK = ''

export default (
  placeholder: Placeholder,
  data: Object,
  options?: { strict?: Boolean; formatters?: Formatters; fallback?: string }
): ContentPlaceholder => {
  const rawWithoutBrackets = placeholder.raw.slice(2, -2).trim()

  const [inputRaw, ...transformations] = split(rawWithoutBrackets, '|').map(s => s.trim())

  const input = evaluateInput(inputRaw, data, options)

  const pipes = []
  let transformedValue = input.value
  for (let transformation of transformations) {
    const pipe = transformValue(transformedValue, transformation, data, options)
    pipes.push(pipe)
    transformedValue = pipe.output
  }

  const output = pipes.length == 0 ? input.value : pipes[pipes.length - 1].output

  return {
    ...placeholder,
    type: 'content',
    input,
    pipes,
    output
  } as ContentPlaceholder
}

// A custom split function that only splits toplevel and not inside parantheses
const split = (str: string, separator: string): string[] => {
  const parts = []
  let nestedLevel = 0
  let lastSlice = 0
  for (let i = 0; i < str.length; i++) {
    if (i === str.length - 1) {
      parts.push(str.slice(lastSlice))
    } else if (str[i] === separator && nestedLevel === 0) {
      parts.push(str.slice(lastSlice, i))
      lastSlice = i + 1
    } else if (str[i] === '(') {
      nestedLevel++
    } else if (str[i] === ')') {
      if (nestedLevel > 0) nestedLevel--
    }
  }
  return parts
}

const evaluateInput = (
  raw: string,
  data: Object,
  options?: { strict?: Boolean; fallback?: string }
): { raw: string; error?: Error; value: any } => {
  try {
    return { raw, value: dot(raw, data) }
  } catch (error) {
    // Bubble up the error in strict mode
    if (options && options.strict) {
      throw error
    }
    if ((options && options.fallback) === undefined) {
      return { raw, error, value: DEFAULT_FALLBACK }
    } else {
      return { raw, error, value: options && options.fallback }
    }
  }
}

const transformValue = (
  value: any,
  transformation: string,
  data: Object,
  options?: { strict?: Boolean; formatters?: Formatters; fallback?: string }
) => {
  try {
    return {
      raw: transformation,
      output: pipe(value, transformation, data, options)
    }
  } catch (error) {
    // Bubble up the error in strict mode
    if (options && options.strict) {
      throw error
    }
    // Ignore unknown/invalid formatters in non-strict mode
    return { raw: transformation, error, output: value }
  }
}
