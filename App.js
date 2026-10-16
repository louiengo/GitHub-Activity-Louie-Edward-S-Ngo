import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BUTTON_ROWS = [
  ["√", "x²", "1/x", "ANS"],
  ["AC", "DEL", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["±", "0", ".", "="],
];

const OPERATORS = {
  "÷": "/",
  "×": "*",
  "−": "-",
  "+": "+",
};

const OPERATOR_LABELS = {
  "/": "÷",
  "*": "×",
  "-": "−",
  "+": "+",
};

function formatResult(value) {
  if (!Number.isFinite(value)) return "Error";
  const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+":
      return formatResult(left + right);
    case "-":
      return formatResult(left - right);
    case "*":
      return formatResult(left * right);
    case "/":
      return right === 0 ? "Error" : formatResult(left / right);
    default:
      return String(right);
  }
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");
  const [lastAnswer, setLastAnswer] = useState(null);

  const clear = () => {
    setDisplay("0");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  };

  const inputDigit = (digit) => {
    if (display === "Error") {
      setDisplay(digit);
      setFirstOperand(null);
      setOperator(null);
      setExpression("");
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    const digitCount = display.replace(/[-.]/g, "").length;
    if (digitCount >= 12) return;
    setDisplay(display === "0" ? digit : `${display}${digit}`);
  };

  const inputDecimal = () => {
    if (display === "Error") {
      setDisplay("0.");
      setFirstOperand(null);
      setOperator(null);
      setExpression("");
      setWaitingForOperand(false);
      return;
    }

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  };

  const toggleSign = () => {
    if (display === "Error" || display === "0") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : `-${display}`);
    setWaitingForOperand(false);
  };

  const inputPercent = () => {
    if (display === "Error") return;
    setDisplay(formatResult(parseFloat(display) / 100));
    setWaitingForOperand(false);
  };

  const deleteDigit = () => {
    if (display === "Error" || waitingForOperand) {
      setDisplay("0");
      setWaitingForOperand(false);
      return;
    }

    const shortened = display.slice(0, -1);
    setDisplay(shortened === "" || shortened === "-" ? "0" : shortened);
  };

  const performOperation = (nextOperator) => {
    if (display === "Error") return;

    const inputValue = parseFloat(display);
    if (waitingForOperand && nextOperator !== "=") {
      if (firstOperand === null) {
        setFirstOperand(inputValue);
      }
      setOperator(nextOperator);
      setExpression(`${display} ${OPERATOR_LABELS[nextOperator]}`);
      return;
    }

    if (firstOperand === null) {
      if (nextOperator !== "=") {
        setFirstOperand(inputValue);
        setOperator(nextOperator);
        setExpression(`${display} ${OPERATOR_LABELS[nextOperator]}`);
        setWaitingForOperand(true);
      }
      return;
    }

    if (operator === null) return;

    const result = calculate(firstOperand, inputValue, operator);
    const completedExpression = `${firstOperand} ${OPERATOR_LABELS[operator]} ${display}`;
    if (result === "Error") {
      setDisplay(result);
      setFirstOperand(null);
      setOperator(null);
      setWaitingForOperand(false);
      setExpression(`${completedExpression} =`);
      return;
    }

    setDisplay(result);
    if (nextOperator === "=") {
      setLastAnswer(result);
      setFirstOperand(null);
      setOperator(null);
      setWaitingForOperand(true);
      setExpression(`${completedExpression} =`);
      return;
    }

    setFirstOperand(parseFloat(result));
    setOperator(nextOperator);
    setWaitingForOperand(true);
    setExpression(`${result} ${OPERATOR_LABELS[nextOperator]}`);
  };

  const performScientificOperation = (label) => {
    if (display === "Error") return;
    const value = parseFloat(display);
    let result;

    if (label === "√") {
      result = value < 0 ? "Error" : formatResult(Math.sqrt(value));
    } else if (label === "x²") {
      result = formatResult(value * value);
    } else {
      result = value === 0 ? "Error" : formatResult(1 / value);
    }

    const nextExpression = `${label}(${display}) =`;
    setDisplay(result);
    setExpression(nextExpression);
    setFirstOperand(null);
    setOperator(null);
    setWaitingForOperand(true);
    if (result !== "Error") {
      setLastAnswer(result);
    }
  };

  const handlePress = (label) => {
    if (label === "AC") {
      clear();
    } else if (label === "DEL") {
      deleteDigit();
    } else if (label === "±") {
      toggleSign();
    } else if (label === "%") {
      inputPercent();
    } else if (label === "ANS") {
      if (lastAnswer !== null) {
        setDisplay(lastAnswer);
        setFirstOperand(null);
        setOperator(null);
        setWaitingForOperand(false);
      }
    } else if (label === "√" || label === "x²" || label === "1/x") {
      performScientificOperation(label);
    } else if (label === ".") {
      inputDecimal();
    } else if (label === "=") {
      if (operator !== null && firstOperand !== null && !waitingForOperand) {
        performOperation("=");
      }
    } else if (Object.prototype.hasOwnProperty.call(OPERATORS, label)) {
      performOperation(OPERATORS[label]);
    } else {
      inputDigit(label);
    }
  };

  const buttonStyle = (label) => {
    if (["AC", "DEL", "ANS"].includes(label)) return styles.actionButton;
    if (["√", "x²", "1/x"].includes(label)) return styles.scientificButton;
    if (label === "=") return styles.equalsButton;
    if (Object.prototype.hasOwnProperty.call(OPERATORS, label)) {
      return styles.operatorButton;
    }
    if (label === "%" || label === "±") return styles.utilityButton;
    return styles.numberButton;
  };

  const buttonTextStyle = (label) => {
    if (label === "=") return styles.equalsText;
    if (["AC", "DEL", "ANS"].includes(label)) return styles.actionText;
    if (Object.prototype.hasOwnProperty.call(OPERATORS, label)) {
      return styles.operatorText;
    }
    if (["√", "x²", "1/x", "ANS"].includes(label)) {
      return styles.scientificText;
    }
    if (label === "AC" || label === "DEL" || label === "%" || label === "±") {
      return styles.utilityText;
    }
    return styles.numberText;
  };

  const displayFontSize = display.length > 10 ? 34 : display.length > 7 ? 42 : 52;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAF3FF" />
      <View style={styles.content}>
        <View style={styles.calculatorCard}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.title}>CALCULATOR</Text>
            </View>
          </View>

          <View style={styles.display}>
            <Text style={styles.expression} numberOfLines={1}>
              {expression}
            </Text>
            <Text
              style={[styles.result, { fontSize: displayFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityRole="text"
              accessibilityLabel={`Display ${display}`}
            >
              {display}
            </Text>
          </View>

          <View style={styles.keypad}>
            {BUTTON_ROWS.map((row, rowIndex) => (
              <View style={styles.buttonRow} key={`row-${rowIndex}`}>
                {row.map((label) => (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.72}
                    accessibilityRole="button"
                    accessibilityLabel={label === "DEL" ? "Delete" : label}
                    onPress={() => handlePress(label)}
                    style={[styles.button, buttonStyle(label)]}
                  >
                    <Text style={[styles.buttonText, buttonTextStyle(label)]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  content: {
    width: "100%",
    maxWidth: 426,
    alignSelf: "center",
  },
  calculatorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D8E7FA",
    padding: 18,
    shadowColor: "#2D5F9E",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  heading: {
    flex: 1,
  },
  title: {
    color: "#183B68",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  display: {
    minHeight: 102,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    backgroundColor: "#F0F6FF",
    borderWidth: 1,
    borderColor: "#D8E7FA",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  expression: {
    color: "#71849E",
    fontSize: 12,
    fontWeight: "500",
    minHeight: 16,
    marginBottom: 4,
  },
  result: {
    color: "#111827",
    fontWeight: "700",
    maxWidth: "100%",
  },
  keypad: {
    gap: 9,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 9,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  numberButton: {
    backgroundColor: "#F4D84A",
    borderWidth: 1,
    borderColor: "#E7C83A",
  },
  utilityButton: {
    backgroundColor: "#D6E7FF",
    borderWidth: 1,
    borderColor: "#C3DAF8",
  },
  actionButton: {
    backgroundColor: "#8B5E3C",
  },
  scientificButton: {
    backgroundColor: "#F3F7FD",
    borderWidth: 1,
    borderColor: "#DCE7F5",
  },
  operatorButton: {
    backgroundColor: "#35A86B",
  },
  equalsButton: {
    backgroundColor: "#08B4CC",
    shadowColor: "#08B4CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
  },
  numberText: {
    color: "#111111",
  },
  utilityText: {
    color: "#24548D",
    fontSize: 18,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
  scientificText: {
    color: "#315A87",
    fontSize: 16,
    fontWeight: "600",
  },
  operatorText: {
    color: "#FFFFFF",
    fontSize: 25,
  },
  equalsText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },
});
