class JSONParser {
  static states = {
    VALUE_START: 0,
    OBJECT_END_OR_KEY_START: 2,
    OBJECT_KEY: 3,
    OBJECT_KEY_END: 4,
    STRING_VALUE: 5,
    NUMBER_VALUE: 6,
    VALUE_END: 8,
  };

  constructor() {
    this.state = 0; // Current state of the parser
    this.ch = null; // Current character being processed
    this.result = []; // Accumulated result string
    this.needClose = []; // Stack to track open brackets/braces/quotes that need closing
    this.isNumberZero = false; // Flag to indicate if a numeric value is starting with 0
    this.isFloat = false; // Flag to indicate if a numeric value is a float
    this.numberValue = [];
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
    if (val.at(0) !== "{") val = "{" + val;

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

    // Close remaining brackets/braces
    while (this.needClose.length > 0) {
      this.removeTrailingComma();
      this.result.push(this.needClose.pop());
    }

    const result = this.result.join("");
    console.log(result);

    return result;
  }

  // Handles Value start (object, string, number, array, null, bool)
  state0() {
    switch (this.ch) {
      case "{":
        this.needClose.push("}");
        this.result.push(this.ch);
        this.state = JSONParser.states.OBJECT_END_OR_KEY_START;
        break;
      case '"':
      case "'":
        this.needClose.push('"');
        this.result.push('"');
        this.state = JSONParser.states.STRING_VALUE;
        break;
      case "[":
        this.needClose.push("]");
        this.result.push(this.ch);
        break;
      case "n":
        this.result.push(..."null");
        this.state = JSONParser.states.VALUE_END;
        break;
      case "t":
        this.result.push(..."true");
        this.state = JSONParser.states.VALUE_END;
        break;
      case "f":
        this.result.push(..."false");
        this.state = JSONParser.states.VALUE_END;
        break;
      default:
        if (this.ch === "-" || this.isDigit()) {
          this.numberValue.push(this.ch);
          this.state = JSONParser.states.NUMBER_VALUE;
        } else {
          this.result.push(..."null");
          this.state = JSONParser.states.VALUE_END;
        }
    }
  }

  // Handles Object end or next key start
  state2() {
    if (this.ch === "}") {
      this.removeTrailingComma();
      this.result.push(this.needClose.pop());
      this.state = JSONParser.states.VALUE_END;
    } else {
      if (this.ch !== '"') this.result.push('"');
      if (this.ch === "'") this.ch = "";
      this.needClose.push('"');
      this.result.push(this.ch);
      this.state = JSONParser.states.OBJECT_KEY;
    }
  }

  // Handles Object Key
  state3() {
    if (this.ch === '"' || this.ch === "'") {
      this.needClose.pop();
      this.ch = '"';
      this.state = JSONParser.states.OBJECT_KEY_END;
    } else if (this.ch === ":") {
      this.needClose.pop();
      this.result.push('"');
      this.state = JSONParser.states.VALUE_START;
    }
    this.result.push(this.ch);
  }

  // Handles Object Key end
  state4() {
    this.state = JSONParser.states.VALUE_START;
    if (this.ch === ":" || this.ch === "=") {
      this.ch = ":";
      this.result.push(this.ch);
    } else {
      this.result.push(":");
      this.state0();
    }
  }

  // Handles String Value
  state5() {
    if (this.ch === '"' || this.ch === "'") {
      this.needClose.pop();
      this.ch = '"';
      this.state = JSONParser.states.VALUE_END;
    }
    this.result.push(this.ch);
  }

  // Handles Number Value
  state6() {
    if (this.isDigit()) {
      this.numberValue.push(this.ch);
    } else if (this.ch === "." && !this.isFloat) {
      this.numberValue.push(this.ch);
      this.isFloat = true;
    } else {
      const parsedNum = Number(this.numberValue.join("")).toString();
      this.result.push(...parsedNum);
      this.numberValue = [];
      this.isFloat = false;
      this.state = JSONParser.states.VALUE_END;
      this.state8();
    }
  }

  // Handles End of Value
  state8() {
    switch (this.ch) {
      case ",":
        this.result.push(this.ch);
        this.state =
          this.needClose.at(-1) === "}"
            ? JSONParser.states.OBJECT_END_OR_KEY_START
            : JSONParser.states.VALUE_START;
        break;

      case "}":
      case "]":
        if (this.needClose.at(-1) === this.ch) {
          this.removeTrailingComma();
          this.result.push(this.needClose.pop());
        }
        break;

      case '"':
        if (this.needClose.at(-1) === "}") {
          this.needClose.push('"');
          this.result.push(",", this.ch);
          this.state = JSONParser.states.OBJECT_KEY;
        }
        break;
    }
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
    const stateHandlers = [
      this.state0,
      this.state1,
      this.state2,
      this.state3,
      this.state4,
      this.state5,
      this.state6,
      this.state7,
      this.state8,
    ];

    const handler = stateHandlers[this.state];
    if (handler) {
      handler.call(this);
    }
  }

  handleLastState() {
    this.ch = "";

    switch (this.state) {
      case 0:
        if (this.result.at(-1) !== "[") {
          this.state0();
        }
        break;

      case 3:
        if (this.result.at(-1) === '"') {
          this.result.push(..."autoFilled");
        }
        this.result.push(...'":null');
        this.needClose.pop();
        break;

      case 4:
        this.state4();
        break;

      case 6:
        this.state6();
        break;
    }
  }
}
