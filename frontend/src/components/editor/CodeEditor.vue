<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, placeholder as cmPlaceholder } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxHighlighting, HighlightStyle, foldGutter, foldKeymap, bracketMatching, indentOnInput, indentUnit } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap, autocompletion } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { linter, type Diagnostic } from '@codemirror/lint'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { tags as t } from '@lezer/highlight'
import { useFormatters } from '@/composables/useFormatters'

const props = withDefaults(defineProps<{
  modelValue?: string
  language?: 'json' | 'xml' | 'html' | 'javascript' | 'graphql' | 'text'
  readonly?: boolean
  placeholder?: string
  showLineNumbers?: boolean
  showFoldGutter?: boolean
  minHeight?: string
  autoFormat?: boolean
}>(), {
  modelValue: '',
  language: 'text',
  readonly: false,
  showLineNumbers: true,
  showFoldGutter: true,
  minHeight: '120px',
  autoFormat: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const view = shallowRef<EditorView | null>(null)
const langCompartment = new Compartment()
const readonlyCompartment = new Compartment()

// Custom highlight style using CSS variables
const fcHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: 'var(--fc-accent)' },
  { tag: t.string, color: 'var(--fc-green)' },
  { tag: t.number, color: 'var(--fc-orange)' },
  { tag: t.bool, color: 'var(--fc-purple)' },
  { tag: t.null, color: 'var(--fc-text-muted)' },
  { tag: t.keyword, color: 'var(--fc-purple)' },
  { tag: t.tagName, color: 'var(--fc-red)' },
  { tag: t.attributeName, color: 'var(--fc-orange)' },
  { tag: t.attributeValue, color: 'var(--fc-green)' },
  { tag: t.comment, color: 'var(--fc-text-muted)', fontStyle: 'italic' },
  { tag: t.variableName, color: 'var(--fc-cyan)' },
  { tag: t.definition(t.variableName), color: 'var(--fc-cyan)' },
  { tag: t.function(t.variableName), color: 'var(--fc-yellow)' },
  { tag: t.typeName, color: 'var(--fc-cyan)' },
  { tag: t.angleBracket, color: 'var(--fc-text-secondary)' },
  { tag: t.bracket, color: 'var(--fc-text-secondary)' },
  { tag: t.paren, color: 'var(--fc-text-secondary)' },
  { tag: t.punctuation, color: 'var(--fc-text-muted)' },
  { tag: t.operator, color: 'var(--fc-pink)' },
])

const fcEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--fc-bg-tertiary)',
    color: 'var(--fc-text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--fc-font-mono)',
    borderRadius: 'var(--fc-radius-md)',
    border: '1px solid var(--fc-border)',
  },
  '.cm-content': {
    caretColor: 'var(--fc-accent)',
    padding: '8px 0',
    fontFamily: 'inherit',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--fc-accent)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--fc-accent-dim)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--fc-bg-hover)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--fc-bg-secondary)',
    color: 'var(--fc-text-muted)',
    border: 'none',
    borderRight: '1px solid var(--fc-border)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--fc-bg-hover)',
  },
  '.cm-foldGutter .cm-gutterElement': {
    color: 'var(--fc-text-muted)',
    cursor: 'pointer',
    padding: '0 4px',
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: 'var(--fc-accent)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--fc-accent-dim)',
    color: 'var(--fc-accent)',
    border: 'none',
    padding: '0 4px',
    borderRadius: '3px',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--fc-border-active)',
    boxShadow: '0 0 0 2px var(--fc-accent-dim)',
  },
  '.cm-placeholder': {
    color: 'var(--fc-text-muted)',
    fontStyle: 'italic',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--fc-bg-secondary)',
    border: '1px solid var(--fc-border)',
    borderRadius: 'var(--fc-radius-md)',
    color: 'var(--fc-text-primary)',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '4px 8px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--fc-bg-hover)',
    color: 'var(--fc-text-primary)',
  },
  '.cm-diagnostic': {
    padding: '3px 6px 3px 10px',
    borderRadius: '0',
  },
  '.cm-diagnostic-error': {
    borderLeft: '3px solid var(--fc-red)',
  },
  '.cm-diagnostic-warning': {
    borderLeft: '3px solid var(--fc-orange)',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--fc-red)',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--fc-orange)',
    textUnderlineOffset: '3px',
  },
})

function getLanguageExtension(lang: string) {
  switch (lang) {
    case 'json': return [json(), linter(jsonParseLinter())]
    case 'xml': return xml()
    case 'html': return html()
    case 'javascript':
    case 'graphql':
      return javascript()
    default: return []
  }
}

/**
 * Custom Enter handler for JSON: auto-insert a missing comma after a value
 * before inserting the newline + indent.
 *
 * Detects if cursor is at end of a JSON value (string, number, bool, null, }, ])
 * and the next non-whitespace char is NOT a comma, colon, }, or ] — meaning
 * another value/key follows. In that case, insert a comma first.
 */
function jsonAutoCommaOnEnter(view: EditorView): boolean {
  const state = view.state
  const { head } = state.selection.main

  // Get text from line start to cursor, and from cursor to end of doc
  const line = state.doc.lineAt(head)
  const beforeCursor = state.doc.sliceString(line.from, head).trimEnd()

  if (!beforeCursor) return false // empty line, let default handle

  const lastChar = beforeCursor[beforeCursor.length - 1]

  // Check if the line before cursor ends with a value terminator
  const isValueEnd = (
    lastChar === '"' ||        // end of string value
    lastChar === '}' ||        // end of object
    lastChar === ']' ||        // end of array
    /\d$/.test(beforeCursor) || // end of number
    beforeCursor.endsWith('true') ||
    beforeCursor.endsWith('false') ||
    beforeCursor.endsWith('null')
  )

  if (!isValueEnd) return false

  // Make sure this isn't a key (followed by colon).
  // Look at what's after cursor on the same line.
  const afterCursorOnLine = state.doc.sliceString(head, line.to).trimStart()
  if (afterCursorOnLine.startsWith(':')) return false

  // Check if the text before cursor on this line contains a colon (it's a value, not a lone key)
  // OR if the value is }, ], number, bool, null (which are always values, not keys)
  if (lastChar === '"') {
    // A string could be a key or a value. Check if there's a colon before it on this line.
    // Find the matching opening quote
    const lineText = state.doc.sliceString(line.from, head)
    // Simple heuristic: if there's a ":" before this string on the same line,
    // or if this is inside an array context, it's a value
    const colonIdx = lineText.lastIndexOf(':')
    const openBracketIdx = Math.max(lineText.lastIndexOf('{'), lineText.lastIndexOf('['))

    // If there's a colon and it comes after the last opening bracket, this string is a value
    if (colonIdx === -1 || colonIdx < openBracketIdx) {
      // No colon found, or colon is before the bracket — this might be a key, not a value
      // Don't auto-insert comma after keys
      // But we need to check the broader context: look backwards in the doc for the context
      // If we're in an array, it IS a value even without a colon on this line
      // Simple check: scan backwards for the enclosing { or [
      const textBefore = state.doc.sliceString(0, line.from)
      let depth = 0
      for (let j = textBefore.length - 1; j >= 0; j--) {
        const c = textBefore[j]
        if (c === '}' || c === ']') depth++
        else if (c === '{' || c === '[') {
          if (depth === 0) {
            if (c === '[') break // array context, it's a value
            // object context: this string is likely a key, don't add comma
            return false
          }
          depth--
        }
      }
    }
  }

  // Check if there's already a comma right after cursor (possibly with whitespace)
  const afterCursor = state.doc.sliceString(head, Math.min(head + 50, state.doc.length)).trimStart()
  if (afterCursor.startsWith(',')) return false

  // Check if next meaningful char is } or ] (end of container) — don't add comma
  if (afterCursor.startsWith('}') || afterCursor.startsWith(']')) return false

  // Also check the full line after cursor position: if there's nothing meaningful
  // after cursor on remaining lines until we hit content, and that content starts with } or ],
  // don't add comma
  const restOfDoc = state.doc.sliceString(head, state.doc.length).trimStart()
  if (restOfDoc.startsWith('}') || restOfDoc.startsWith(']')) return false

  // All checks passed — insert comma at cursor position, then do normal Enter
  view.dispatch({
    changes: { from: head, to: head, insert: ',' },
  })

  // Now run the default newline+indent
  return false // returning false lets the default Enter handler run after our comma insertion
}

let updating = false

onMounted(() => {
  if (!containerRef.value) return

  const extensions = [
    fcEditorTheme,
    syntaxHighlighting(fcHighlightStyle),
    highlightSpecialChars(),
    drawSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    indentUnit.of('  '),
    autocompletion(),
    history(),
    keymap.of([
      // JSON auto-comma: runs before default Enter handler
      ...(props.language === 'json' ? [{
        key: 'Enter',
        run: jsonAutoCommaOnEnter,
      }] : []),
      indentWithTab,
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...foldKeymap,
    ]),
    langCompartment.of(getLanguageExtension(props.language)),
    readonlyCompartment.of(EditorState.readOnly.of(props.readonly)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !updating) {
        const val = update.state.doc.toString()
        emit('update:modelValue', val)
      }
    }),
  ]

  // Auto-format JSON on blur (with auto-fix for common errors)
  if (props.autoFormat && props.language === 'json') {
    extensions.push(
      EditorView.domEventHandlers({
        blur(event, editorView) {
          const doc = editorView.state.doc.toString().trim()
          if (!doc) return
          // First try direct parse, then try fixing common errors
          const { fixJson } = useFormatters()
          let parsed: any
          try {
            parsed = JSON.parse(doc)
          } catch {
            try {
              const fixed = fixJson(doc)
              parsed = JSON.parse(fixed)
            } catch {
              return // Unfixable, leave as-is
            }
          }
          try {
            const formatted = JSON.stringify(parsed, null, 2)
            if (formatted !== doc) {
              updating = true
              editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: formatted },
              })
              updating = false
              emit('update:modelValue', formatted)
            }
          } catch {
            // Shouldn't happen, but be safe
          }
        },
      })
    )
  }

  if (props.showLineNumbers) extensions.push(lineNumbers())
  if (props.showFoldGutter) extensions.push(foldGutter())
  if (props.placeholder) extensions.push(cmPlaceholder(props.placeholder))

  view.value = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions,
    }),
    parent: containerRef.value,
  })
})

watch(() => props.modelValue, (newVal) => {
  if (!view.value) return
  const current = view.value.state.doc.toString()
  if (current !== newVal) {
    updating = true
    view.value.dispatch({
      changes: { from: 0, to: current.length, insert: newVal || '' },
    })
    updating = false
  }
})

watch(() => props.language, (newLang) => {
  if (!view.value) return
  view.value.dispatch({
    effects: langCompartment.reconfigure(getLanguageExtension(newLang)),
  })
})

watch(() => props.readonly, (newVal) => {
  if (!view.value) return
  view.value.dispatch({
    effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(newVal)),
  })
})

onUnmounted(() => {
  view.value?.destroy()
})
</script>

<template>
  <div
    ref="containerRef"
    class="code-editor overflow-hidden rounded-lg"
    :style="{ minHeight }"
  />
</template>

<style scoped>
.code-editor :deep(.cm-editor) {
  min-height: v-bind(minHeight);
  max-height: 100%;
}
.code-editor :deep(.cm-scroller) {
  overflow: auto;
}
</style>
