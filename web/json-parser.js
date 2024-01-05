class JSONParser {
  constructor() {
    this.state = 0; // Current state of the parser
    this.ch = null; // Current character being processed
    this.result = ""; // Accumulated result string
    this.needClose = []; // Stack to track open brackets/braces that need closing
    this.isFloat = false; // Flag to indicate if a numeric value is a float
    this.nullBool = ""; // Temporary storage for potential null, true, or false values
  }

  /**
   * Parses and fixes a JSON string.
   *
   * @param {string} val - The input JSON string to be parsed and fixed.
   * @returns {string} The fixed JSON string.
   */
  parseAndFix(val) {
    if (val.length === 0) return "";
    if (val.at(0) !== "{") val = "{" + val;

    for (const ch of val) {
      if (ch === " " || ch === "\n" || ch === "\t") continue;

      this.ch = ch;
      this.handleState();
    }

    this.handleLastState();

    // Close remaining brackets/braces
    while (this.needClose.length > 0) {
      this.removeTrailingComma();
      this.result += this.needClose.pop();
    }

    console.log(this.result);

    return this.result;
  }

  // Handles Object start
  state0() {
    this.needClose.push("}");
    this.result += this.ch;
    this.state = 1;
  }

  // Handles Object end or next key start
  state1() {
    if (this.ch === "}") {
      this.removeTrailingComma();
      this.result += this.needClose.pop();
      this.state = 8;
      return;
    }
    if (this.ch !== '"') this.result += '"';
    if (this.ch === "'") this.ch = "";
    this.result += this.ch;
    this.state = 2;
  }

  // Handles Object Key
  state2() {
    if (this.ch === '"' || this.ch === "'") {
      this.ch = '"';
      this.state = 3;
    } else if (this.ch === ":") {
      this.result += '"';
      this.state = 4;
    }
    this.result += this.ch;
  }

  // Handles Object Key end
  state3() {
    this.state = 4;
    if (this.ch === ":" || this.ch === "=") {
      this.ch = ":";
      this.result += this.ch;
    } else {
      this.result += ":";
      this.state4();
    }
  }

  // Handles Value start (string, digit, object, array, null, bool)
  state4() {
    if (this.ch === '"' || this.ch === "'") {
      this.result += '"';
      this.state = 5;
    } else if (this.isDigit()) {
      this.result += this.ch;
      this.state = 6;
    } else if (this.ch === "{") {
      this.state0();
    } else if (this.ch === "[") {
      this.needClose.push("]");
      this.result += this.ch;
    } else if (this.ch === "n" || this.ch === "t" || this.ch === "f") {
      this.nullBool += this.ch;
      this.state = 7;
    } else {
      this.result += "null";
      this.state = 8;
    }
  }

  // Handles String Value
  state5() {
    if (this.ch === '"' || this.ch === "'") {
      this.ch = '"';
      this.state = 8;
    }
    this.result += this.ch;
  }

  // Handles Number Value
  state6() {
    if (this.isDigit()) {
      this.result += this.ch;
    } else if (this.ch === "." && !this.isFloat) {
      this.result += this.ch;
      this.isFloat = true;
    } else {
      this.isFloat = false;
      this.state = 8;
      this.state8();
    }
  }

  // Handles Null / Bool
  state7() {
    const keywords = ["null", "true", "false"];
    const tmp = this.nullBool + this.ch;
    if (keywords.find((w) => w === tmp) !== undefined) {
      this.result += tmp;
      this.nullBool = "";
      this.state = 8;
    } else if (keywords.find((w) => w.includes(tmp)) !== undefined) {
      this.nullBool += this.ch;
      console.log(this.nullBool);
    } else {
      this.result += keywords.find((w) => w.includes(this.nullBool));
      this.nullBool = "";
      this.state = 8;
      this.state8();
    }
  }

  // Handles End of Value
  state8() {
    switch (this.ch) {
      case ",":
        this.result += this.ch;
        this.state = this.needClose.at(-1) === "}" ? 1 : 4;
        break;
      case "}":
      case "]":
        if (this.needClose.at(-1) === this.ch) {
          this.removeTrailingComma();
          this.result += this.needClose.pop();
        }
        break;
      case '"':
        if (this.needClose.at(-1) === "}") {
          this.result += "," + this.ch;
          this.state = 2;
        }
    }
  }

  isDigit() {
    return this.ch >= "0" && this.ch <= "9";
  }

  removeTrailingComma() {
    if (this.result.at(-1) === ",") {
      this.result = this.result.slice(0, -1);
    }
  }

  handleState() {
    switch (this.state) {
      case 0:
        this.state0();
        break;
      case 1:
        this.state1();
        break;
      case 2:
        this.state2();
        break;
      case 3:
        this.state3();
        break;
      case 4:
        this.state4();
        break;
      case 5:
        this.state5();
        break;
      case 6:
        this.state6();
        break;
      case 7:
        this.state7();
        break;
      case 8:
        this.state8();
        break;
    }
  }

  handleLastState() {
    this.ch = null;
    switch (this.state) {
      case 2:
        this.result += this.result.at(-1) === '"' ? "autoFilled" : "";
        this.ch = '"';
        this.state2();
        this.ch = ":";
        this.state3();
        this.state4();
        break;
      case 3:
        this.state3();
        break;
      case 4:
        if (this.result.at(-1) === "[") break;
        this.state4();
        break;
      case 7:
        this.state7();
        break;
    }
  }
}
