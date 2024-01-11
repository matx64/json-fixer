class JSONParser {
  static states = {
    VALUE_START: 0,
    OBJECT_VALUE: 1,
    OBJECT_KEY: 2,
    OBJECT_KEY_END: 3,
    STRING_VALUE: 4,
    NUMBER_VALUE: 5,
    VALUE_END: 6,
  };

  constructor() {
    this.state = 0; // Current state of the parser
    this.ch = null; // Current character being processed
    this.result = []; // Accumulated result string
    this.needClose = []; // Stack to track open blocks that need closing
    this.numberValue = []; // Accumulated number value
    this.isFloat = false; // Flag to indicate if a numeric value is a float
  }

  /**
   * Parses and fixes a JSON string.
   *
   * @param {string} val - The input JSON string to be parsed and fixed.
   * @returns {string} The fixed JSON string.
   */
  parseAndFix(val) {
    val = val.trim();

    if (val.length === 0) return "";

    for (const ch of val) {
      if (
        (ch === " " && this.needClose.at(-1) !== '"') ||
        ch === "\n" ||
        ch === "\t"
      )
        continue;

      this.ch = ch;
      this.handleState();
    }

    this.handleLastState();
    this.closeBlocks();

    const result = this.result.join("");
    console.log(result);

    return result;
  }

  // Handles Value start (object, string, number, array, null, bool)
  handleValueStart() {
    switch (this.ch) {
      case "{":
        this.needClose.push("}");
        this.resultPush();
        this.state = JSONParser.states.OBJECT_VALUE;
        break;
      case '"':
      case "'":
        this.needClose.push('"');
        this.resultPush('"');
        this.state = JSONParser.states.STRING_VALUE;
        break;
      case "[":
        this.needClose.push("]");
        this.resultPush();
        break;
      case "n":
        this.resultPush("null");
        this.state = JSONParser.states.VALUE_END;
        break;
      case "t":
        this.resultPush("true");
        this.state = JSONParser.states.VALUE_END;
        break;
      case "f":
        this.resultPush("false");
        this.state = JSONParser.states.VALUE_END;
        break;
      default:
        if (this.ch === "-" || this.isDigit()) {
          this.numberValue.push(this.ch);
          this.state = JSONParser.states.NUMBER_VALUE;
        } else {
          this.resultPush("null");
          this.state = JSONParser.states.VALUE_END;
        }
    }
  }

  // Handles Object
  handleObjectValue() {
    if (this.ch === "}") {
      this.removeTrailingComma();
      this.resultPush(this.needClose.pop());
      this.state = JSONParser.states.VALUE_END;
    } else {
      if (this.ch !== '"') this.resultPush('"');
      if (this.ch === "'") this.ch = "";
      this.needClose.push('"');
      this.resultPush();
      this.state = JSONParser.states.OBJECT_KEY;
    }
  }

  // Handles Object Key
  handleObjectKey() {
    if (this.ch === '"' || this.ch === "'") {
      this.needClose.pop();
      this.ch = '"';
      this.state = JSONParser.states.OBJECT_KEY_END;
    } else if (this.ch === ":") {
      this.needClose.pop();
      this.resultPush('"');
      this.state = JSONParser.states.VALUE_START;
    }
    this.resultPush();
  }

  // Handles Object Key end
  handleObjectKeyEnd() {
    this.state = JSONParser.states.VALUE_START;
    if (this.ch === ":" || this.ch === "=") {
      this.ch = ":";
      this.resultPush();
    } else {
      this.resultPush(":");
      this.handleValueStart();
    }
  }

  // Handles String Value
  handleStringValue() {
    if (this.ch === '"' || this.ch === "'") {
      this.needClose.pop();
      this.ch = '"';
      this.state = JSONParser.states.VALUE_END;
    }
    this.resultPush();
  }

  // Handles Number Value
  handleNumberValue() {
    if (this.isDigit()) {
      this.numberValue.push(this.ch);
    } else if (this.ch === "." && !this.isFloat) {
      this.numberValue.push(this.ch);
      this.isFloat = true;
    } else {
      const parsedNum = Number(this.numberValue.join("")).toString();
      this.resultPush(parsedNum);
      this.numberValue = [];
      this.isFloat = false;
      this.state = JSONParser.states.VALUE_END;
      this.handleValueEnd();
    }
  }

  // Handles Value end
  handleValueEnd() {
    switch (this.ch) {
      case ",":
        if (this.needClose.length > 0) {
          this.resultPush();
          this.state =
            this.needClose.at(-1) === "}"
              ? JSONParser.states.OBJECT_VALUE
              : JSONParser.states.VALUE_START;
        }
        break;

      case "}":
      case "]":
        if (this.needClose.at(-1) === this.ch) {
          this.removeTrailingComma();
          this.resultPush(this.needClose.pop());
        }
        break;

      case '"':
        if (this.needClose.at(-1) === "}") {
          this.needClose.push('"');
          this.resultPush(",");
          this.resultPush();
          this.state = JSONParser.states.OBJECT_KEY;
        }
        break;
    }
  }

  resultPush(val = this.ch) {
    this.result.push(...val);
  }

  isDigit() {
    return this.ch >= "0" && this.ch <= "9";
  }

  removeTrailingComma() {
    if (this.result.at(-1) === ",") {
      this.result.pop();
    }
  }

  handleState() {
    switch (this.state) {
      case JSONParser.states.VALUE_START:
        this.handleValueStart();
        break;
      case JSONParser.states.OBJECT_VALUE:
        this.handleObjectValue();
        break;
      case JSONParser.states.OBJECT_KEY:
        this.handleObjectKey();
        break;
      case JSONParser.states.OBJECT_KEY_END:
        this.handleObjectKeyEnd();
        break;
      case JSONParser.states.STRING_VALUE:
        this.handleStringValue();
        break;
      case JSONParser.states.NUMBER_VALUE:
        this.handleNumberValue();
        break;
      case JSONParser.states.VALUE_END:
        this.handleValueEnd();
        break;
    }
  }

  handleLastState() {
    this.ch = "";

    switch (this.state) {
      case this.state.VALUE_START:
        if (this.result.at(-1) !== "[" && this.result.at(-1) !== ",") {
          this.handleValueStart();
        }
        break;

      case this.state.OBJECT_KEY:
        if (this.result.at(-1) === '"') {
          this.resultPush("autoFilled");
        }
        this.resultPush('":null');
        this.needClose.pop();
        break;

      case this.state.OBJECT_KEY_END:
        this.handleObjectKeyEnd();
        break;

      case this.state.NUMBER_VALUE:
        this.handleNumberValue();
        break;
    }
  }

  // Close remaining brackets/braces
  closeBlocks() {
    while (this.needClose.length > 0) {
      this.removeTrailingComma();
      this.resultPush(this.needClose.pop());
    }
    this.removeTrailingComma();
  }
}
