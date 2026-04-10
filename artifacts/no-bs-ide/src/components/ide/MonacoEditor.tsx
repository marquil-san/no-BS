import { useRef, useEffect, useCallback, useState } from "react";
import { flushSync } from "react-dom";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import type { IDESettings, TokenCategory } from "@/hooks/useSettings";
import type * as monacoTypes from "monaco-editor";

interface MonacoEditorProps {
  value: string;
  onChange: (v: string) => void;
  settings: any;
  onSave: () => void;
  onMountEditor?: (editor: any) => void; // 🔥 ADD THIS
}

const IDENTIFIER_COLORS = [
  "#ff5555", // red
  "#ff6b6b",

  "#ff8c42", // orange
  "#ffb86c",

  "#f1fa8c", // yellow
  "#f7ff7a",

  "#50fa7b", // green
  "#3cffc0",

  "#8be9fd", // cyan
  "#00e5ff",
  "#00ffff", // 🔥 pure cyan

  "#bd93f9", // purple
  "#caa9fa",

  "#ff79c6", // pink
  "#ff92df",
  "#ff4fd8", // 🔥 stronger pink

  "#7df9ff", // icy cyan
  "#a0ffff",

  "#ffffff", // accent
];

const identifierColorMap = new Map<string, string>();

function getColorForIdentifier(name: string): string {
  if (!identifierColorMap.has(name)) {
    const color =
      IDENTIFIER_COLORS[identifierColorMap.size % IDENTIFIER_COLORS.length];
    identifierColorMap.set(name, color);
  }
  return identifierColorMap.get(name)!;
}
const PYTHON_KEYWORDS = [
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is",
  "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
  "while", "with", "yield",
];

const PYTHON_BUILTINS = [
  "abs", "all", "any", "ascii", "bin", "bool", "breakpoint", "bytearray",
  "bytes", "callable", "chr", "classmethod", "compile", "complex",
  "copyright", "credits", "delattr", "dict", "dir", "divmod", "enumerate",
  "eval", "exec", "exit", "filter", "float", "format", "frozenset",
  "getattr", "globals", "hasattr", "hash", "help", "hex", "id", "input",
  "int", "isinstance", "issubclass", "iter", "len", "license", "list",
  "locals", "map", "max", "memoryview", "min", "next", "object", "oct",
  "open", "ord", "pow", "print", "property", "quit", "range", "repr",
  "reversed", "round", "set", "setattr", "slice", "sorted", "staticmethod",
  "str", "sum", "super", "tuple", "type", "vars", "zip",
];

function extractWordsFromCode(code: string): string[] {
  const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const words = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = identifierRegex.exec(code)) !== null) {
    const w = match[1];
    if (!PYTHON_KEYWORDS.includes(w) && !PYTHON_BUILTINS.includes(w)) words.add(w);
  }
  return Array.from(words);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface AnimEntry {
  pattern: RegExp;
  className: string;
  labelLen: number;
}

function buildAnimEntries(cats: TokenCategory[]): AnimEntry[] {
  const entries: AnimEntry[] = [];

  for (const cat of cats) {
    if (cat.id === "strings") continue;

    for (const tok of cat.tokens) {
      if (!tok.style.gradient?.enabled) continue;

      let patStr: string;
      const isRegex = tok.label.includes("\\") || tok.label.includes("[");

      if (cat.id === "keywords" || cat.id === "builtins") {
        patStr = `\\b${escapeRegex(tok.label)}\\b`;
      } else if (isRegex) {
        patStr = tok.label;
      } else {
        patStr = escapeRegex(tok.label);
      }

      entries.push({
        pattern: new RegExp(patStr, "g"),
        className: `nobs-ov-${tok.id}`,
        labelLen: tok.label.length,
      });
    }
  }

  // 🔴 import target (e.g. "import random")
  entries.push({
    pattern: /(?<=\bimport\s)[a-zA-Z_][a-zA-Z0-9_]*/g,
    className: "nobs-ov-import-target",
    labelLen: 20,
  });

  // 🎨 auto identifiers
  entries.push({
    pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
    className: "nobs-ov-auto-id",
    labelLen: 1,
  });

  // 🔥 priority system
  const priority: Record<string, number> = {
    "import-target": 999,
    functionCall: 4,
    number: 3,
    punc_lparen: 2,
    punc_rparen: 2,
    punc_lbracket: 2,
    punc_rbracket: 2,
    punc_lbrace: 2,
    punc_rbrace: 2,
    variable: 1,
    "auto-id": 0,
  };

  entries.sort((a, b) => {
    const aId = a.className.replace("nobs-ov-", "");
    const bId = b.className.replace("nobs-ov-", "");
    const pa = priority[aId] ?? 0;
    const pb = priority[bId] ?? 0;
    return pb - pa || b.labelLen - a.labelLen;
  });

  return entries;
}

function buildOverlayCSS(cats: TokenCategory[]): string {
  const rules: string[] = [];

  // 🔴 Import target (always red, no animation)
  rules.push(`
.nobs-ov-import-target {
  color: #ff5555;
  -webkit-text-fill-color: #ff5555;
}
`);

  // 🔹 Normal token styles
  for (const cat of cats) {
    if (cat.id === "strings") continue;

    for (const tok of cat.tokens) {
      if (!tok.style.gradient?.enabled) continue;

      const g = tok.style.gradient;
      const cls = `nobs-ov-${tok.id}`;
      const kf = `nobs-ov-kf-${tok.id}`;
      const gradAngle = g.direction === "diagonal" ? "135deg" : "90deg";

      rules.push(`
@keyframes ${kf} {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.${cls} {
  display: inline-block;
  background: linear-gradient(${gradAngle}, ${g.color1}, ${g.color2}, ${g.color1});
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: ${kf} ${g.speed}s linear infinite;
  font-weight: inherit;
  font-style: inherit;
  font-size: inherit;
  font-family: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  tab-size: inherit;
  white-space: pre;
}`);
    }
  }

  // 🔥 Auto identifier colors (animated)
  for (const color of IDENTIFIER_COLORS) {
    const clean = color.replace("#", "");
    const cls = `nobs-ov-auto-${clean}`;
    const kf = `nobs-ov-auto-kf-${clean}`;

    rules.push(`
@keyframes ${kf} {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.${cls} {
  display: inline-block;
  background: linear-gradient(90deg, ${color}, #ffffff, ${color});
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: ${kf} 2s linear infinite;
}
`);
  }

  return rules.join("\n");
}

function markProtectedRanges(line: string): boolean[] {
  const protectedMap = new Array(line.length).fill(false);

  // 🔹 Python strings (", ', ''' """)
  const stringRegex = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')/g;
  let m: RegExpExecArray | null;

  while ((m = stringRegex.exec(line)) !== null) {
    for (let i = m.index; i < m.index + m[0].length; i++) {
      protectedMap[i] = true;
    }
  }

  // 🔹 Comments (# ...)
  const commentIndex = line.indexOf("#");
  if (commentIndex !== -1) {
    for (let i = commentIndex; i < line.length; i++) {
      protectedMap[i] = true;
    }
  }

  return protectedMap;
}

function tokenizeLine(line: string, entries: AnimEntry[]): Segment[] {
  const n = line.length;
  const protectedMap = markProtectedRanges(line);
  const claimed = new Array<string | null>(n).fill(null);

  for (const { pattern, className } of entries) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = pattern.exec(line)) !== null) {
      let ok = true;

      for (let i = m.index; i < m.index + m[0].length; i++) {
        if (claimed[i] !== null || protectedMap[i]) {
          ok = false;
          break;
        }
      }

      if (ok) {
        for (let i = m.index; i < m.index + m[0].length; i++) {
          claimed[i] = className;
        }
      }
    }
  }

  const segs: Segment[] = [];
  let i = 0;

  while (i < n) {
    const cls = claimed[i];
    let j = i + 1;

    while (j < n && claimed[j] === cls) j++;

    const text = line.slice(i, j);

    // 🎨 auto identifier coloring
    if (cls === "nobs-ov-auto-id" && !protectedMap[i]) {
      const color = getColorForIdentifier(text);
      const dynamicClass = `nobs-ov-auto-${color.replace("#", "")}`;

      segs.push({
        text,
        cls: dynamicClass,
      });
    }

    // 🔴 import target (force red)
    else if (cls === "nobs-ov-import-target") {
      segs.push({
        text,
        cls: "nobs-ov-import-target",
      });
    }

    else {
      segs.push({ text, cls });
    }

    i = j;
  }

  return segs;
}

function buildMonacoThemeRules(cats: TokenCategory[]): monacoTypes.editor.ITokenThemeRule[] {
  const rules: monacoTypes.editor.ITokenThemeRule[] = [];
  const catToScope: Record<string, string> = {
    keywords: "keyword",
    builtins: "support.function",
    operators: "keyword.operator",
    strings: "string",
    punctuation: "punctuation",
  };

  for (const cat of cats) {
    const scope = catToScope[cat.id] ?? cat.id;
    for (const tok of cat.tokens) {
      const color = tok.style.gradient?.enabled
        ? tok.style.gradient.color1
        : tok.style.color;

      rules.push({
        token: scope,
        foreground: color.replace("#", ""),
        fontStyle: [tok.style.bold ? "bold" : "", tok.style.italic ? "italic" : ""]
          .filter(Boolean)
          .join(" ") || undefined,
      });
    }
  }

  

  return rules;
}
interface OverlayMetrics {
  contentLeft: number;
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;
  tabSize: number;
  paddingTop: number;

  // 🔥 ADD THIS
  startLine: number;
}

interface GradientOverlayProps {
  lines: Segment[][];
  metrics: OverlayMetrics;
  innerRef: React.RefObject<HTMLDivElement | null>;
}

function GradientOverlay({ lines, metrics, innerRef }: GradientOverlayProps) {
  const hasAny = lines.some((segs) => segs.some((s) => s.cls !== null));
  if (!hasAny) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: metrics.contentLeft,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <div
        ref={innerRef}
        style={{
          position: "absolute",
          top: metrics.paddingTop,
          left: 0,
          right: 0,
          height: `${lines.length * metrics.lineHeight}px`,

          // ✅ match Monaco text exactly
          fontSize: `${metrics.fontSize}px`,
          fontFamily: metrics.fontFamily,
          lineHeight: `${metrics.lineHeight}px`,
          whiteSpace: "pre",

          willChange: "transform",
        }}
      >
        {lines.map((segs, li) => (
          <div
            key={`${metrics.startLine}-${li}`}
            style={{
              height: metrics.lineHeight,
              lineHeight: `${metrics.lineHeight}px`,
              overflow: "hidden",
              display: "block",
              whiteSpace: "pre",
            }}
          >
            {segs.map((seg, si) =>
              seg.cls ? (
                <span key={`${metrics.startLine}-${li}-${si}`} className={seg.cls}>
                  {seg.text}
                </span>
              ) : (
                <span key={`${metrics.startLine}-${li}-${si}`} style={{ color: "#e6edf3" }}>
                  {seg.text}
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonacoEditor({
  value,
  onChange,
  settings,
  onSave,
  onMountEditor, // 🔥 ADD THIS
}: MonacoEditorProps) {
  const overlayVersionRef = useRef(0);
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionDisposableRef = useRef<monacoTypes.IDisposable | null>(null);
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const overlayInnerRef = useRef<HTMLDivElement | null>(null);
  const contentUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a ref so event handlers always have the latest tokenCategories without stale closures
  const tokenCategoriesRef = useRef(settings.tokenCategories);
  useEffect(() => {
    tokenCategoriesRef.current = settings.tokenCategories;
  }, [settings.tokenCategories]);

  const [overlayLines, setOverlayLines] = useState<Segment[][]>([]);
  const [overlayMetrics, setOverlayMetrics] = useState<OverlayMetrics>({
  contentLeft: 64,
  lineHeight: 22,
  fontSize: settings.fontSize,
  fontFamily: settings.fontFamily,
  letterSpacing: 0,
  tabSize: settings.tabSize,
  paddingTop: 16,
  startLine: 1, // 🔥 ADD THIS
});

  const rebuildOverlay = useCallback(
  (
    code: string,
    cats: TokenCategory[],
    editor?: monacoTypes.editor.IStandaloneCodeEditor,
    monaco?: Monaco
  ) => {
    // 🔥 version guard (prevents race condition / duplicate overlay)
    const version = ++overlayVersionRef.current;

    const model = editor?.getModel();
    if (!model) return;

    const visibleRanges = editor.getVisibleRanges();
    if (!visibleRanges.length) return;

    const start = visibleRanges[0].startLineNumber;
    const end = visibleRanges[0].endLineNumber;

    const entries = buildAnimEntries(cats);

    const newLines: Segment[][] = [];

    for (let i = start; i <= end; i++) {
      const line = model.getLineContent(i);
      newLines.push(tokenizeLine(line, entries));
    }

    // 🔥 ignore outdated renders
    if (version !== overlayVersionRef.current) return;

    flushSync(() => {
  setOverlayLines(newLines);
});

    if (editor && monaco) {
      const EditorOption = monaco.editor.EditorOption;
      const layout = editor.getLayoutInfo();
      const paddingOpt = editor.getOption(EditorOption.padding) as
        | { top: number; bottom: number }
        | undefined;

      // 🔥 ignore outdated renders again (important)
      if (version !== overlayVersionRef.current) return;

      flushSync(() => {
  setOverlayMetrics({
    contentLeft: layout.contentLeft,
    lineHeight: editor.getOption(EditorOption.lineHeight),
    fontSize: editor.getOption(EditorOption.fontSize),
    fontFamily: editor.getOption(EditorOption.fontFamily),
    letterSpacing: editor.getOption(EditorOption.letterSpacing),
    tabSize: editor.getOption(EditorOption.tabSize),
    paddingTop: paddingOpt?.top ?? 16,
    startLine: start,
  });
});
    }
  },
  []
);
  const applyTheme = useCallback((monaco: Monaco, cats: TokenCategory[]) => {
    monaco.editor.defineTheme("nobs-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.foreground": "#00000000", // 🔥 make base text invisible
        "editor.background": "#00000000",
        "editor.lineHighlightBackground": "#00000000",
	"editor.lineHighlightBorder": "#00000000",
	"editorCursor.background": "#00000000",
	"editor.selectionHighlightBackground": "#00000000",
	"editor.hoverHighlightBackground": "#00000000",
        "editorGutter.background": "#00000000",
        "editor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editor.selectionBackground": "#264f78",
        "editor.lineHighlightBackground": "#161b22",
        "editorCursor.foreground": "#58a6ff",
      },
    });
    monaco.editor.setTheme("nobs-dark");
  }, []);

function extractFileVariables(code: string): Set<string> {
  const vars = new Set<string>();

  // f = open(...)
  const assignRegex = /\b([a-zA-Z_]\w*)\s*=\s*open\s*\(/g;
  let match;

  while ((match = assignRegex.exec(code))) {
    vars.add(match[1]);
  }

  // with open(...) as f
  const withRegex = /\bwith\s+open\s*\([^)]*\)\s+as\s+([a-zA-Z_]\w*)/g;

  while ((match = withRegex.exec(code))) {
    vars.add(match[1]);
  }

  return vars;
}

  const updateCompletionProvider = useCallback((monaco: Monaco, code: string) => {
  completionDisposableRef.current?.dispose();

  // 🔴 ERRORS
  const PYTHON_ERRORS = [
    "Exception","ValueError","TypeError","RuntimeError","IndexError",
    "KeyError","AttributeError","ImportError","ModuleNotFoundError",
    "ZeroDivisionError","FileNotFoundError","AssertionError",
    "OverflowError","MemoryError","StopIteration","NameError",
    "IndentationError","SyntaxError","NotImplementedError"
  ];

const FILE_METHODS = [
  "read",
  "readline",
  "readlines",
  "write",
  "writelines",
  "close",
  "seek",
  "tell",
  "flush",
];

  // 🔥 MODULES
  const MODULE_METHODS: Record<string, string[]> = {
  math: [
    "acos","acosh","asin","asinh","atan","atan2","atanh",
    "ceil","comb","copysign","cos","cosh","degrees","dist",
    "erf","erfc","exp","expm1","fabs","factorial","floor",
    "fmod","frexp","fsum","gamma","gcd","hypot","isclose",
    "isfinite","isinf","isnan","isqrt","lcm","ldexp","lgamma",
    "log","log10","log1p","log2","perm","pow","prod",
    "radians","remainder","sin","sinh","sqrt","tan","tanh","trunc"
  ],

  random: [
    "random","randint","randrange","uniform","choice","choices",
    "shuffle","sample","seed","getstate","setstate",
    "betavariate","expovariate","gammavariate","gauss",
    "lognormvariate","normalvariate","paretovariate",
    "triangular","vonmisesvariate","weibullvariate"
  ],

  statistics: [
    "mean","fmean","geometric_mean","harmonic_mean",
    "median","median_low","median_high","median_grouped",
    "mode","multimode","quantiles",
    "variance","pvariance","stdev","pstdev",
    "covariance","correlation","linear_regression"
  ],

  time: [
    "time","time_ns","sleep","ctime","perf_counter",
    "perf_counter_ns","process_time","process_time_ns",
    "strftime","strptime","gmtime","localtime","mktime",
    "monotonic","monotonic_ns","tzset"
  ],

  csv: [
    "reader","writer","DictReader","DictWriter",
    "Sniffer","register_dialect","unregister_dialect",
    "get_dialect","list_dialects"
  ],

  pickle: [
    "dump","dumps","load","loads",
    "Pickler","Unpickler"
  ],

  json: [
    "dump","dumps","load","loads",
    "JSONEncoder","JSONDecoder"
  ],

  re: [
    "compile","search","match","fullmatch",
    "split","findall","finditer","sub","subn",
    "escape","purge"
  ],

  os: [
    "system","getcwd","chdir","listdir","mkdir","makedirs",
    "remove","unlink","rmdir","removedirs","rename","replace",
    "stat","walk","scandir","chmod","chown",
    "getenv","putenv","unsetenv",
    "cpu_count","urandom"
  ],

  sys: [
    "exit","getsizeof","getrecursionlimit",
    "setrecursionlimit","gettrace","settrace"
  ],

  datetime: [
    "date","datetime","time","timedelta","timezone",
    "now","today","utcnow","fromtimestamp","strptime"
  ],

  collections: [
    "Counter","defaultdict","deque","namedtuple","ChainMap","OrderedDict"
  ],

  itertools: [
    "count","cycle","repeat","accumulate","chain","compress",
    "dropwhile","filterfalse","groupby","islice","starmap",
    "takewhile","tee","zip_longest","product","permutations","combinations","combinations_with_replacement"
  ],

  functools: [
    "partial","reduce","lru_cache","wraps","cached_property","cmp_to_key"
  ],

  subprocess: [
    "run","Popen","call","check_call","check_output","getoutput","getstatusoutput"
  ],

  threading: [
    "Thread","Lock","RLock","Semaphore","Event","Condition","Timer","Barrier","current_thread"
  ],

  multiprocessing: [
    "Process","Pool","Queue","Lock","cpu_count","Manager"
  ],

  pathlib: [
    "Path","PurePath","PurePosixPath","PureWindowsPath"
  ],

  shutil: [
    "copy","copy2","copyfile","copytree","move","rmtree",
    "disk_usage","which","make_archive","unpack_archive"
  ],

  tempfile: [
    "TemporaryFile","NamedTemporaryFile","TemporaryDirectory","gettempdir"
  ],

  glob: [
    "glob","iglob","escape"
  ],

  argparse: [
    "ArgumentParser","ArgumentError","Namespace"
  ],

  logging: [
    "debug","info","warning","error","critical",
    "basicConfig","getLogger","Logger","Handler","Formatter"
  ],

  hashlib: [
    "md5","sha1","sha224","sha256","sha384","sha512","blake2b","blake2s"
  ],

  hmac: [
    "new","compare_digest"
  ],

  secrets: [
    "token_bytes","token_hex","token_urlsafe","choice","randbelow"
  ],

  string: [
    "ascii_letters","ascii_lowercase","ascii_uppercase",
    "digits","hexdigits","octdigits","punctuation",
    "whitespace","capwords"
  ],

  enum: [
    "Enum","IntEnum","auto","Flag","IntFlag"
  ],

  typing: [
    "Any","Union","Optional","List","Dict","Tuple","Set",
    "Callable","TypeVar","Generic","Protocol"
  ],

  dataclasses: [
    "dataclass","field","asdict","astuple","replace","is_dataclass"
  ],

  inspect: [
    "getmembers","isfunction","ismethod","isclass",
    "getsource","signature","stack","currentframe"
  ],

  platform: [
    "system","node","release","version","machine","processor","python_version"
  ],

  socket: [
    "socket","create_connection","gethostname","gethostbyname"
  ],

  struct: [
    "pack","unpack","calcsize","Struct"
  ],

  traceback: [
    "print_exc","format_exc","extract_tb","format_tb"
  ],

  uuid: [
    "uuid1","uuid3","uuid4","uuid5"
  ],

  warnings: [
    "warn","filterwarnings","simplefilter","resetwarnings"
  ],

  weakref: [
    "ref","proxy","WeakKeyDictionary","WeakValueDictionary","WeakSet"
  ],

  zipfile: [
    "ZipFile","is_zipfile"
  ],

  tarfile: [
    "open","is_tarfile"
  ]
};

  const MODULE_NAMES = [
  "math","random","statistics","time","csv","pickle",

  // 🔥 NEW
  "os","sys","json","re","datetime","collections",
  "itertools","functools","subprocess","threading",
  "multiprocessing","pathlib","shutil","tempfile",
  "glob","argparse","logging","hashlib","hmac",
  "secrets","string","enum","typing","dataclasses",
  "inspect","platform","socket","struct","traceback",
  "uuid","warnings","weakref","zipfile","tarfile"
];

  // 🔥 CSV OBJECT METHODS
  const CSV_DICT_READER_METHODS = ["fieldnames","__iter__","__next__"];
  const CSV_DICT_WRITER_METHODS = ["writeheader","writerow","writerows"];

  const LIST_METHODS = ["append","extend","insert","remove","pop","clear","index","count","sort","reverse","copy"];
  const TUPLE_METHODS = ["count","index"];
  const DICT_METHODS = ["keys","values","items","get","update","pop","popitem","clear","copy","setdefault"];
  const STRING_METHODS = [
  "capitalize",
  "casefold",
  "center",
  "count",
  "encode",
  "endswith",
  "expandtabs",
  "find",
  "format",
  "format_map",
  "index",
  "isalnum",
  "isalpha",
  "isascii",
  "isdigit",
  "islower",
  "isspace",
  "istitle",
  "isupper",
  "join",
  "ljust",
  "lower",
  "lstrip",
  "maketrans",
  "partition",
  "replace",
  "rfind",
  "rindex",
  "rjust",
  "rpartition",
  "rsplit",
  "rstrip",
  "split",
  "splitlines",
  "startswith",
  "strip",
  "swapcase",
  "title",
  "translate",
  "upper",
  "zfill"
];

  const userWords = extractWordsFromCode(code);

  completionDisposableRef.current =
    monaco.languages.registerCompletionItemProvider("python", {
      triggerCharacters: [".", "(", ","],

      provideCompletionItems: (model, position) => {
        const wordInfo = model.getWordUntilPosition(position);
        const currentWord = wordInfo.word || "";
        const current = currentWord.toLowerCase();

        const line = model.getLineContent(position.lineNumber);
        const textUntilPos = line.slice(0, position.column - 1);

        // ❌ STOP ON WHITESPACE
        // ❌ STOP ON WHITESPACE (space, tab, etc.)
const lastChar = textUntilPos.slice(-1);

if (!lastChar || /\s/.test(lastChar)) {
  return { suggestions: [] };
}
if (currentWord.length === 0) return { suggestions: [] };

        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endColumn: wordInfo.endColumn,
        };

        const mk = (label, kind, detail, priority = 2) => {
  const isFunctionLike =
    kind === monaco.languages.CompletionItemKind.Function ||
    kind === monaco.languages.CompletionItemKind.Method;

  return {
    label,
    kind,
    range,

    insertText: isFunctionLike ? `${label}($0)` : label,

    insertTextRules: isFunctionLike
      ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,

    sortText: `${priority}_${label.toLowerCase()}`, // 🔥 KEY FIX
    preselect: priority === 0, // 🔥 ensures Enter picks it
  };
};

        const fullCode = model.getValue();

        // 🔥 IMPORT MAP (alias support)
        const importMap = new Map<string, string>();
        const importRegex = /^\s*import\s+(\w+)(\s+as\s+(\w+))?/gm;
        let m;
        while ((m = importRegex.exec(fullCode))) {
          importMap.set(m[3] || m[1], m[1]);
        }

        // 🔥 FROM IMPORT
        const fromImportSet = new Set<string>();
        const fromRegex = /^\s*from\s+\w+\s+import\s+(.+)/gm;
        let fm;
        while ((fm = fromRegex.exec(fullCode))) {
          fm[1].split(",").forEach(x => {
            const clean = x.trim().split(" as ")[1] || x.trim().split(" as ")[0];
            fromImportSet.add(clean);
          });
        }

        // 🔴 ERROR AUTOCOMPLETE
        if (/^[A-Z]/.test(currentWord)) {
          const sorted = PYTHON_ERRORS
            .filter(e => e.toLowerCase().includes(current))
            .sort((a, b) => {
              if (a.toLowerCase().startsWith(current)) return -1;
              if (b.toLowerCase().startsWith(current)) return 1;
              return a.length - b.length;
            });

          return {
            suggestions: sorted.map(e =>
              mk(e, monaco.languages.CompletionItemKind.Class, "Exception")
            )
          };
        }

        // 🔥 IMPORT AUTOCOMPLETE
        if (/^\s*import\s+\w*$/.test(textUntilPos)) {
          return {
            suggestions: MODULE_NAMES.map(m =>
              mk(m, monaco.languages.CompletionItemKind.Module, "module", 0)
            )
          };
        }

        // 🔥 FROM IMPORT AUTOCOMPLETE
        const fromMatch = textUntilPos.match(/^from\s+(\w+)\s+import\s+(\w*)$/);
        if (fromMatch) {
          const mod = fromMatch[1];
          const methods = MODULE_METHODS[mod];
          if (methods) {
            return {
              suggestions: methods.map(m =>
                mk(m, monaco.languages.CompletionItemKind.Function, `${mod} import`)
              )
            };
          }
        }

        // 🔥 DOT DETECTION
        const dotMatch = textUntilPos.match(/(\w+)\.\w*$/);
        const objectName = dotMatch?.[1];

// 🔥 FILE OBJECT METHODS (open / with open)
if (objectName) {
  const fileVars = extractFileVariables(fullCode);

  if (fileVars.has(objectName)) {
    return {
      suggestions: FILE_METHODS.map(m =>
        mk(m, monaco.languages.CompletionItemKind.Method, "file")
      )
    };
  }
}

        // 🔥 MODULE DOT
        if (objectName && importMap.has(objectName)) {
          const mod = importMap.get(objectName)!;
          const methods = MODULE_METHODS[mod];
          if (methods) {
            return {
              suggestions: methods.map(m =>
                mk(m, monaco.languages.CompletionItemKind.Function, `${mod} module`)
              )
            };
          }
        }

        // 🔥 CSV OBJECTS
        if (objectName) {
          if (new RegExp(`${objectName}\\s*=\\s*csv\\.DictReader`).test(fullCode)) {
            return {
              suggestions: CSV_DICT_READER_METHODS.map(m =>
                mk(m, monaco.languages.CompletionItemKind.Method, "DictReader")
              )
            };
          }

          if (new RegExp(`${objectName}\\s*=\\s*csv\\.DictWriter`).test(fullCode)) {
            return {
              suggestions: CSV_DICT_WRITER_METHODS.map(m =>
                mk(m, monaco.languages.CompletionItemKind.Method, "DictWriter")
              )
            };
          }
        }

        // 🔥 TYPE INFERENCE
        if (objectName) {
          const match = fullCode.match(new RegExp(`${objectName}\\s*=\\s*(.+)`));
          if (match) {
            const val = match[1].trim();

            if (val.startsWith("[")) return { suggestions: LIST_METHODS.map(m => mk(m, monaco.languages.CompletionItemKind.Method, "list")) };
            if (val.startsWith("{")) return { suggestions: DICT_METHODS.map(m => mk(m, monaco.languages.CompletionItemKind.Method, "dict")) };
            if (val.startsWith("(")) return { suggestions: TUPLE_METHODS.map(m => mk(m, monaco.languages.CompletionItemKind.Method, "tuple")) };
            if (val.startsWith('"') || val.startsWith("'")) return { suggestions: STRING_METHODS.map(m => mk(m, monaco.languages.CompletionItemKind.Method, "string")) };
          }
        }

        

if (!/[a-zA-Z_]/.test(lastChar)) {
  return { suggestions: [] };
}
        if (currentWord.length < 2) return { suggestions: [] };
        const filteredUserWords = userWords.filter(w =>
  w.length > 2 && w !== currentWord // 🔥 removes "pri"
);

        return {
          suggestions: [
            ...PYTHON_BUILTINS.map(b =>
  mk(b, monaco.languages.CompletionItemKind.Function, "builtin", 1)
),
            ...PYTHON_KEYWORDS.map(k =>
  mk(k, monaco.languages.CompletionItemKind.Keyword, "keyword", 1)
),
           
...filteredUserWords.map(w =>
  mk(w, monaco.languages.CompletionItemKind.Variable, "user", 3)
),
          ]
        };
      },
    });

}, []);

  // handleMount is stable (no settings in deps) — we use tokenCategoriesRef for fresh values
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      if (onMountEditor) onMountEditor(editor);

      applyTheme(monaco, tokenCategoriesRef.current);
      updateCompletionProvider(monaco, value);
      rebuildOverlay(value, tokenCategoriesRef.current, editor, monaco);
editor.updateOptions({
  stickyScroll: {
    enabled: false,
  },
});
     

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave?.());

      monaco.languages.setLanguageConfiguration("python", {
  indentationRules: {
    increaseIndentPattern:
      /^\s*(def|class|if|elif|else|for|while|with|try|except|finally|async)\b.*:\s*$/,
    decreaseIndentPattern: /^\s*(pass|break|continue|return)\b/,
  },

  // ❌ REMOVE onEnterRules completely

  brackets: [["(", ")"], ["[", "]"], ["{", "}"]],
  autoClosingPairs: [
    { open: "(", close: ")" }, { open: "[", close: "]" }, { open: "{", close: "}" },
    { open: '"', close: '"' }, { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "(", close: ")" }, { open: "[", close: "]" }, { open: "{", close: "}" },
    { open: '"', close: '"' }, { open: "'", close: "'" },
  ],
});

      editor.onDidChangeModelContent((e) => {
  const model = editor.getModel();
  const position = editor.getPosition();
  if (!model || !position) return;

  const line = model.getLineContent(position.lineNumber);
  const textUntilPos = line.slice(0, position.column - 1);
  const lastChar = textUntilPos.slice(-1);

  const typedWhitespace = e.changes.some(c => /\s/.test(c.text));

  if (!lastChar || /\s/.test(lastChar) || typedWhitespace) {
    editor.trigger("keyboard", "hideSuggestWidget", {});
  }
});

     let rafId: number | null = null;

editor.onDidScrollChange(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);

  rafId = requestAnimationFrame(() => {
    const code = editor.getModel()?.getValue() ?? "";
    rebuildOverlay(code, tokenCategoriesRef.current, editor, monaco);
  });
});
   

      editor.onDidLayoutChange(() => {
        const code = editor.getModel()?.getValue() ?? "";
        rebuildOverlay(code, tokenCategoriesRef.current, editor, monaco);
      });

      // Sync initial scroll position
      if (overlayInnerRef.current) {
        const scrollTop = editor.getScrollTop();
const scrollLeft = editor.getScrollLeft();
const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);

const offsetY = Math.floor(scrollTop / lineHeight) * lineHeight;

      }
    },
    [applyTheme, rebuildOverlay, updateCompletionProvider, value, onSave]
  );

  // Inject CSS whenever token categories change
  useEffect(() => {
    if (!styleElRef.current) {
      styleElRef.current = document.createElement("style");
      styleElRef.current.setAttribute("data-nobs-overlay", "true");
      document.head.appendChild(styleElRef.current);
    }
    styleElRef.current.textContent = buildOverlayCSS(settings.tokenCategories);
  }, [settings.tokenCategories]);

  // Re-apply Monaco theme when token categories change
  useEffect(() => {
    if (monacoRef.current) applyTheme(monacoRef.current, settings.tokenCategories);
  }, [settings.tokenCategories, applyTheme]);

  // Rebuild overlay when settings or value change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      rebuildOverlay(value, settings.tokenCategories, editorRef.current, monacoRef.current);
    }
  }, [settings.tokenCategories, value, rebuildOverlay]);

  // Sync scroll position after overlay lines update (in case overlay mounts mid-scroll)
  useEffect(() => {
    if (editorRef.current && overlayInnerRef.current) {
      const editor = editorRef.current;
if (!editor) return;

const scrollTop = editor.getScrollTop();
const scrollLeft = editor.getScrollLeft();
const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);

const offsetY = Math.floor(scrollTop / lineHeight) * lineHeight;


    }
  }, [overlayLines]);

  useEffect(() => {
    return () => {
      completionDisposableRef.current?.dispose();
      styleElRef.current?.remove();
      if (contentUpdateTimer.current) clearTimeout(contentUpdateTimer.current);
    };
  }, []);

  return (
    <div className="w-full h-full" style={{ position: "relative", overflow: "hidden" }}>
      <Editor
        height="100%"
        width="100%"
        language="python"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
  fontSize: settings.fontSize,
  fontFamily: settings.fontFamily,
  tabSize: settings.tabSize,

  wordWrap: settings.wordWrap ? "on" : "off",
  minimap: { enabled: settings.minimap },
  lineNumbers: settings.lineNumbers ? "on" : "off",

  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordBasedSuggestions: "off",

  // 🔥 THIS is the fix
  stickyScroll: false,

  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: "smart",
  tabCompletion: "on",

  snippetSuggestions: "inline",
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },

  suggest: {
    showIcons: false,
    showStatusBar: false,
    preview: false,
    showInlineDetails: false,
  },

  inlineSuggest: {
    enabled: false,
  },

  parameterHints: {
    enabled: false,
  },

  padding: { top: 16, bottom: 16 },
  renderWhitespace: "none",

  cursorBlinking: "phase",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,

  fontLigatures: true,

  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
}}
        theme="nobs-dark"
/>

<GradientOverlay
  key={overlayMetrics.startLine} // 🔥 FORCE FULL RESET
  lines={overlayLines}
  metrics={overlayMetrics}
  innerRef={overlayInnerRef}
/>
    </div>
  );
}
