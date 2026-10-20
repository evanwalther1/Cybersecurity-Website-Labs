// Parsing a student-typed linear expression so it can be graded by meaning
// rather than by string match.
//
// The same answer has many correct spellings: `6-8x1`, `-8x1+6`, `6 - 8*x1`,
// `6-8x`. Keeping a list of accepted strings per question would be endless and
// would still reject something reasonable. Instead this reduces whatever was
// typed to a pair of numbers, the constant term and the coefficient on the
// variable, and the grader compares those.
//
// Deliberately narrow: it understands a sum of terms, each either a plain
// number or a number times the one variable. No parentheses, no second
// variable, no powers. Anything else returns null and is marked wrong, which
// is the right call because every answer this lab asks for is a single line.

export interface LinearForm {
  /** The constant term. */
  intercept: number;
  /** The coefficient on the variable. */
  slope: number;
}

const MARKER = "\u0001";

/**
 * Reduce `input` to `intercept + slope * variable`, or null if it is not a
 * linear expression in that variable.
 *
 * `variable` is the full name the question uses, such as "x1". A bare "x" is
 * also accepted, since students routinely drop the subscript when there is
 * only one unknown on screen. A *different* subscript is not accepted: asked
 * for x1, answering in x2 is a real mistake, not a notation choice.
 */
export const parseLinear = (
  input: string,
  variable: string,
): LinearForm | null => {
  let text = input.toLowerCase().replace(/\s+/g, "");
  if (text === "") return null;

  // Unicode minus and en dash, which creep in from copy-paste.
  text = text.replace(/[−–]/g, "-");
  // Multiplication is optional; so is a leading "eua(s1)=" style prefix.
  text = text.replace(/[*×]/g, "");
  text = text.replace(/^[a-z]+\([a-z0-9]+\)=/, "");
  text = text.replace(/^[a-z]+[0-9]*=/, "");

  // Park the variable, then any bare x that is not the start of another
  // subscript. Order matters: x1 has to go before the bare-x rule.
  text = text.split(variable).join(MARKER);
  text = text.replace(/x(?![0-9])/g, MARKER);

  // Anything left outside this set means it was not a plain linear expression.
  if (!new RegExp(`^[0-9.+\\-/${MARKER}]+$`).test(text)) return null;
  // More than one variable in a single term, e.g. "x1x1".
  if (text.includes(MARKER + MARKER)) return null;

  // Split into signed terms. Turning "-" into "+-" lets one split handle both.
  // Empty terms are dropped, which makes a trailing operator ("6-8x1+") parse
  // as if it were not there. That is deliberate leniency: the intent is
  // unambiguous. A doubled operator ("6--8x1") is not, and is rejected below
  // because the resulting term fails to parse as a number.
  const terms = text
    .replace(/-/g, "+-")
    .split("+")
    .filter((t) => t !== "");

  let intercept = 0;
  let slope = 0;

  for (const term of terms) {
    const hasVariable = term.includes(MARKER);
    const raw = hasVariable ? term.split(MARKER).join("") : term;

    let value: number;
    if (hasVariable && (raw === "" || raw === "-")) {
      // A bare "x1" or "-x1" means a coefficient of 1 or -1.
      value = raw === "-" ? -1 : 1;
    } else {
      const parsed = parseFraction(raw);
      if (parsed === null) return null;
      value = parsed;
    }

    if (hasVariable) slope += value;
    else intercept += value;
  }

  return { intercept, slope };
};

/** Accepts "8", "-8", "1.5", "-2.25" and simple fractions like "23/52". */
const parseFraction = (raw: string): number | null => {
  if (raw === "") return null;
  const slash = raw.indexOf("/");
  if (slash === -1) {
    if (!/^-?[0-9]*\.?[0-9]+$/.test(raw)) return null;
    return Number(raw);
  }
  const top = raw.slice(0, slash);
  const bottom = raw.slice(slash + 1);
  if (!/^-?[0-9]*\.?[0-9]+$/.test(top)) return null;
  if (!/^-?[0-9]*\.?[0-9]+$/.test(bottom)) return null;
  const denominator = Number(bottom);
  if (denominator === 0) return null;
  return Number(top) / denominator;
};

const CLOSE = 1e-6;

/** True when the typed expression means the same line as `expected`. */
export const linearMatches = (
  input: string,
  variable: string,
  expected: LinearForm,
): boolean => {
  const got = parseLinear(input, variable);
  if (!got) return false;
  return (
    Math.abs(got.intercept - expected.intercept) < CLOSE &&
    Math.abs(got.slope - expected.slope) < CLOSE
  );
};

/** Canonical rendering, used to show the correct answer on the results page. */
export const formatLinear = (
  { intercept, slope }: LinearForm,
  variable: string,
): string => {
  if (slope === 0) return String(intercept);
  const sign = slope < 0 ? "-" : "+";
  const size = Math.abs(slope);
  const coefficient = size === 1 ? "" : String(size);
  if (intercept === 0) {
    return `${slope < 0 ? "-" : ""}${coefficient}${variable}`;
  }
  return `${intercept} ${sign} ${coefficient}${variable}`;
};
