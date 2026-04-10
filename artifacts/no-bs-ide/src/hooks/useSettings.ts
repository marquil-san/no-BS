import { useState, useCallback } from "react";

export interface TokenStyle {
  color: string;
  gradient?: {
    enabled: boolean;
    color1: string;
    color2: string;
    direction: "linear" | "diagonal";
    speed: number;
  };
  bold?: boolean;
  italic?: boolean;
}

export interface TokenCategory {
  id: string;
  label: string;
  tokens: { id: string; label: string; style: TokenStyle }[];
}

export interface BackgroundConfig {
  type: "none" | "color" | "image" | "video";
  value: string;
}

export interface IDESettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  background: BackgroundConfig;
  tokenCategories: TokenCategory[];
}

const defaultColor = (color: string): TokenStyle => ({
  color,
  gradient: {
    enabled: true,
    color1: color,
    color2: color,
    direction: "linear",
    speed: 2,
  },
});

const DEFAULT_SETTINGS: IDESettings = {
  fontSize: 14,
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
  tabSize: 4,
  wordWrap: false,
  minimap: false,
  lineNumbers: true,
  background: { type: "color", value: "#000000" },
  tokenCategories: [
    {
      id: "keywords",
      label: "Keywords",
      tokens: [
        { id: "kw_def", label: "def", style: defaultColor("#c792ea") },
        { id: "kw_class", label: "class", style: defaultColor("#c792ea") },
        { id: "kw_import", label: "import", style: defaultColor("#c792ea") },
        { id: "kw_from", label: "from", style: defaultColor("#c792ea") },
        { id: "kw_return", label: "return", style: defaultColor("#c792ea") },
        { id: "kw_if", label: "if", style: defaultColor("#c792ea") },
        { id: "kw_else", label: "else", style: defaultColor("#c792ea") },
        { id: "kw_elif", label: "elif", style: defaultColor("#c792ea") },
        { id: "kw_for", label: "for", style: defaultColor("#c792ea") },
        { id: "kw_while", label: "while", style: defaultColor("#c792ea") },
        { id: "kw_in", label: "in", style: defaultColor("#c792ea") },
        { id: "kw_not", label: "not", style: defaultColor("#c792ea") },
        { id: "kw_and", label: "and", style: defaultColor("#c792ea") },
        { id: "kw_or", label: "or", style: defaultColor("#c792ea") },
        { id: "kw_try", label: "try", style: defaultColor("#c792ea") },
        { id: "kw_except", label: "except", style: defaultColor("#c792ea") },
        { id: "kw_finally", label: "finally", style: defaultColor("#c792ea") },
        { id: "kw_with", label: "with", style: defaultColor("#c792ea") },
        { id: "kw_as", label: "as", style: defaultColor("#c792ea") },
        { id: "kw_pass", label: "pass", style: defaultColor("#c792ea") },
        { id: "kw_break", label: "break", style: defaultColor("#c792ea") },
        { id: "kw_continue", label: "continue", style: defaultColor("#c792ea") },
        { id: "kw_lambda", label: "lambda", style: defaultColor("#c792ea") },
        { id: "kw_yield", label: "yield", style: defaultColor("#c792ea") },
        { id: "kw_global", label: "global", style: defaultColor("#c792ea") },
        { id: "kw_nonlocal", label: "nonlocal", style: defaultColor("#c792ea") },
        { id: "kw_del", label: "del", style: defaultColor("#c792ea") },
        { id: "kw_raise", label: "raise", style: defaultColor("#c792ea") },
        { id: "kw_assert", label: "assert", style: defaultColor("#c792ea") },
        { id: "kw_True", label: "True", style: defaultColor("#f78c6c") },
        { id: "kw_False", label: "False", style: defaultColor("#f78c6c") },
        { id: "kw_None", label: "None", style: defaultColor("#f78c6c") },
      ],
    },
    {
      id: "builtins",
      label: "Builtins",
      tokens: [
        { id: "bi_print", label: "print", style: defaultColor("#82aaff") },
        { id: "bi_input", label: "input", style: defaultColor("#82aaff") },
        { id: "bi_len", label: "len", style: defaultColor("#82aaff") },
        { id: "bi_range", label: "range", style: defaultColor("#82aaff") },
        { id: "bi_int", label: "int", style: defaultColor("#82aaff") },
        { id: "bi_str", label: "str", style: defaultColor("#82aaff") },
        { id: "bi_float", label: "float", style: defaultColor("#82aaff") },
        { id: "bi_bool", label: "bool", style: defaultColor("#82aaff") },
        { id: "bi_list", label: "list", style: defaultColor("#82aaff") },
        { id: "bi_dict", label: "dict", style: defaultColor("#82aaff") },
        { id: "bi_set", label: "set", style: defaultColor("#82aaff") },
        { id: "bi_tuple", label: "tuple", style: defaultColor("#82aaff") },
        { id: "bi_type", label: "type", style: defaultColor("#82aaff") },
        { id: "bi_map", label: "map", style: defaultColor("#82aaff") },
        { id: "bi_filter", label: "filter", style: defaultColor("#82aaff") },
        { id: "bi_zip", label: "zip", style: defaultColor("#82aaff") },
        { id: "bi_enumerate", label: "enumerate", style: defaultColor("#82aaff") },
        { id: "bi_sorted", label: "sorted", style: defaultColor("#82aaff") },
        { id: "bi_sum", label: "sum", style: defaultColor("#82aaff") },
        { id: "bi_max", label: "max", style: defaultColor("#82aaff") },
        { id: "bi_min", label: "min", style: defaultColor("#82aaff") },
        { id: "bi_abs", label: "abs", style: defaultColor("#82aaff") },
        { id: "bi_round", label: "round", style: defaultColor("#82aaff") },
        { id: "bi_open", label: "open", style: defaultColor("#82aaff") },
        { id: "bi_isinstance", label: "isinstance", style: defaultColor("#82aaff") },
        { id: "bi_hasattr", label: "hasattr", style: defaultColor("#82aaff") },
        { id: "bi_getattr", label: "getattr", style: defaultColor("#82aaff") },
        { id: "bi_setattr", label: "setattr", style: defaultColor("#82aaff") },
      ],
    },
    {
      id: "operators",
      label: "Operators",
      tokens: [
        { id: "op_plus", label: "+", style: defaultColor("#89ddff") },
        { id: "op_minus", label: "-", style: defaultColor("#89ddff") },
        { id: "op_mul", label: "*", style: defaultColor("#89ddff") },
        { id: "op_div", label: "/", style: defaultColor("#89ddff") },
        { id: "op_mod", label: "%", style: defaultColor("#89ddff") },
        { id: "op_pow", label: "**", style: defaultColor("#89ddff") },
        { id: "op_floordiv", label: "//", style: defaultColor("#89ddff") },
        { id: "op_eq", label: "==", style: defaultColor("#89ddff") },
        { id: "op_neq", label: "!=", style: defaultColor("#89ddff") },
        { id: "op_lt", label: "<", style: defaultColor("#89ddff") },
        { id: "op_gt", label: ">", style: defaultColor("#89ddff") },
        { id: "op_lte", label: "<=", style: defaultColor("#89ddff") },
        { id: "op_gte", label: ">=", style: defaultColor("#89ddff") },
        { id: "op_assign", label: "=", style: defaultColor("#89ddff") },
        { id: "op_pluseq", label: "+=", style: defaultColor("#89ddff") },
        { id: "op_minuseq", label: "-=", style: defaultColor("#89ddff") },
      ],
    },
    {
      id: "strings",
      label: "Strings",
      tokens: [
        { id: "str_single", label: "Single-quoted", style: defaultColor("#A7F3D0") },
        { id: "str_double", label: "Double-quoted", style: defaultColor("#22C55E") },
        { id: "str_triple", label: "Triple-quoted", style: defaultColor("#14532D") },
        { id: "str_fstring", label: "f-strings", style: defaultColor("#2DD4BF") },
      ],
    },
    {
      id: "punctuation",
      label: "Punctuation",
      tokens: [
        { id: "punc_lparen", label: "(", style: defaultColor("#ffcb6b") },
        { id: "punc_rparen", label: ")", style: defaultColor("#ffcb6b") },
        { id: "punc_lbracket", label: "[", style: defaultColor("#ffcb6b") },
        { id: "punc_rbracket", label: "]", style: defaultColor("#ffcb6b") },
        { id: "punc_lbrace", label: "{", style: defaultColor("#ffcb6b") },
        { id: "punc_rbrace", label: "}", style: defaultColor("#ffcb6b") },
        { id: "punc_colon", label: ":", style: defaultColor("#89ddff") },
        { id: "punc_comma", label: ",", style: defaultColor("#89ddff") },
        { id: "punc_dot", label: ".", style: defaultColor("#89ddff") },
        { id: "punc_semicolon", label: ";", style: defaultColor("#89ddff") },
      ],
    },
{
  id: "functions",
  label: "Functions",
  tokens: [
    {
      id: "functionCall",
      label: "(?<=\\.)[a-zA-Z_][a-zA-Z0-9_]*(?=\\()|\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\()",
      style: defaultColor("#00ffff"),
    },
  ],
},

{
  id: "numbers",
  label: "Numbers",
  tokens: [
    {
      id: "number",
      label: "\\b\\d+(\\.\\d+)?\\b",
      style: defaultColor("#b5cea8"),
    },
  ],
},
{
  id: "variables",
  label: "Variables",
  tokens: [
    {
      id: "variable",
      label: "\\b[a-zA-Z_][a-zA-Z0-9_]*\\b(?!\\()",
      style: defaultColor("#ff5555"),
    },
  ],
},

	
  ],
};

const STORAGE_KEY = "nobs-ide-settings";

function loadFromStorage(): IDESettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<IDESettings>;
    return { ...DEFAULT_SETTINGS, ...parsed } as IDESettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<IDESettings>(() => loadFromStorage());

  const updateSetting = useCallback(
    <K extends keyof IDESettings>(key: K, value: IDESettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateTokenStyle = useCallback(
    (categoryId: string, tokenId: string, style: Partial<TokenStyle>) => {
      setSettings((prev) => ({
        ...prev,
        tokenCategories: prev.tokenCategories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                tokens: cat.tokens.map((tok) =>
                  tok.id === tokenId
                    ? { ...tok, style: { ...tok.style, ...style } }
                    : tok
                ),
              }
            : cat
        ),
      }));
    },
    []
  );

  const updateBackground = useCallback((bg: Partial<BackgroundConfig>) => {
    setSettings((prev) => ({
      ...prev,
      background: { ...prev.background, ...bg },
    }));
  }, []);

  const saveSettings = useCallback(() => {
    setSettings((prev) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
      } catch {}
      return prev;
    });
  }, []);

  return { settings, updateSetting, updateTokenStyle, updateBackground, saveSettings };
}
