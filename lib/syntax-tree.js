/*
makeFunctionTree takes a sentence input (line), transforms it into a syntax tree, then returns the top of that tree. The top is a node which implements interpret, which takes state (s) and recursively interprets the whole tree. 
1. Explode the line and get rid of "if" (blacklisted because "then" suffices).
2. Convert each word or word set into a node.
  a. Start from the end and keep adding words to match array. 
  b. After each addition, look for a match from the beginning of the match array. 
  c. A match is made for 1. a data field (VarNode) 2. an operand node (AndNode etc) or an arbitray expression passed into the syntax tree. 
  d. If the match has any leftovers, they are converted to a ValueNode. 
  e. A leftover first work becomes a ValueNode.
3. The next phase requires that every operand node has a left and a right child, so make sure that is the case (add one to the right of "has changed").
4. Keep iterating over the resulting nodes:
  a. Identify the weakest operand.
  b. Find matching operand nodes. 
  c. Make the right and left nodes children of the operand node and take them out of the array.
  At the end of process, only the strongest operand node is left in the array, so return that node.
  The whole tree can be intrepreted via topNode.interpret(state).
*/

function makeSyntaxTree(line, data, exps) {
  const words = lineToWords(line)
  const nodes = wordsToNodes(words, data, exps)
  enforceTriplets(nodes)
  return nodesToTree(nodes)
}

function lineToWords(line) {
  return line.split(" ").filter(word => isNotIn(getWordBlacklist(), word))
}

function wordsToNodes(words, data, exps) {
  const nodes = []
  let match = []

  while (words.length) {
    match.unshift(words.pop())
    let len = match.length, rest = null, node = null
    while (len--) {
      let str = match.slice(0, len + 1).join(" ")
      let rest = len == match.length - 1 ? null : match.slice(len + 1).join(" ")

      let inProps = data.hasOwnProperty(str)
      let inOperands = isIn(getOperands(), str)
      let innodes = nodes.hasOwnProperty(str)

      if (inProps || inOperands || innodes) {
        if (rest) {
          nodes.unshift(new ValueNode(rest))
        }

        if (inOperands) {
          node = makeOperandNode(str)
        } else if (inProps) {
          node = new VarNode(str)
        } else {
          node = nodes[str]
        }

        node.lChild = node.lChild || null
        node.rChild = node.rChild || null
        nodes.unshift(node)

        match = []
        break;
      }
    }

    if (words.length === 0 && match.length > 0) {
      nodes.unshift(new ValueNode(match.join(" ")))
    }
  }
  return nodes
}

function enforceTriplets(nodes) {
  for (var i = 0; i < nodes.length; i++) {
    let node = nodes[i]
    if (node.type === "has changed" && node.lChild === null) {
      nodes.splice(i + 1, 0, new NoOpNode())
      i++;
    }
  }
}

function nodesToTree(nodes) {
  const operands = getOperands()

  while (nodes.length > 1) {
    let operand = operands.pop()
    let operandNodes = nodes.filter(node => node.type === operand && node.lChild === null)
    for (var i = 0; i <operandNodes.length; i++) {
      let node = operandNodes[i]
      var start = nodes.indexOf(node)
      var triplet = nodes.splice(start - 1, 3, node)
      node.lChild = triplet[0]
      node.rChild = triplet[2]
    }
  }

  return nodes.pop()
}

function getOperands() {
  return ["then", "plus", "set", "or", "and", "was", "was not", "is", "is not", "is now", "has changed", "greater than", "less than"]
}

function getWordBlacklist() {
  return ["if"]
}

function makeOperandNode(w) {
  if (w == "is") return new CompareNode(w, is);
  if (w == "is not") return new CompareNode(w, isNot);
  if (w == "is now") return new IsNowNode(w);
  if (w == "was") return new WasCompareNode(w, is);
  if (w == "was not") return new WasCompareNode(w, isNot);
  if (w == "greater than") return new CompareNode(w, greaterThan);
  if (w == "less than") return new CompareNode(w, lessThan);
  if (w == "and") return new CompareNode(w, and);
  if (w == "or") return new CompareNode(w, or);
  if (w == "set") return new SetNode();
  if (w == "then") return new ThenNode();
  if (w == "has changed") return new HasChangedNode();
  if (w == "plus") return new PlusNode();
  throw new Error("NODE TYPE NOT FOUND! " + w)
}

function ValueNode(val) {
  this.type = "value"
  var castVal = val
  if (val == "true" || val == "false") {
    castVal = val == "true"
  } else if (/^[0-9]+$/.test(val)) {
    castVal = parseInt(val)
  } else if (val == "null") {
    castVal = null;
  }
  this.val = castVal;
  this.interpret = function (s) {
    return this.val
  }
}

function VarNode(prop) {
  this.type = "prop"
  this.prop = prop
  this.interpret = function (s, getPrevVal) {
    return s.get(this.prop, getPrevVal)
  }
}

function IsNowNode(prop) {
  this.type = "is now"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s, true)
    var now = this.lChild.interpret(s)
    var val = this.rChild.interpret(s)
    return then !== now && now === val
  }
}

function CompareNode(type, compare) {
  this.type = type;
  this.interpret = function (s) {
    return compare(this.lChild.interpret(s), this.rChild.interpret(s));
  }
}

function WasCompareNode(type, compare) {
  this.type = type;
  this.interpret = function (s) {
    return compare(this.lChild.interpret(s, true), this.rChild.interpret(s));
  }
}

function SetNode() {
  this.type = "set";
  this.interpret = function (s) {
    return s.set(this.lChild.prop, this.rChild.interpret(s));
  }
}

function ThenNode() {
  this.type = "then";
  this.interpret = function (s) {
    if (this.lChild.interpret(s)) {
      return this.rChild.interpret(s)
    }
  }
}

function PlusNode() {
  this.type = "plus";
  this.interpret = function (s) {
    this.lChild.interpret(s)
    this.rChild.interpret(s)
    return true;
  }
}

function HasChangedNode() {
  this.type = "has changed"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s, true)
    var now = this.lChild.interpret(s)
    return now != then
  }
}

function NoOpNode() {
  this.type = "noOp"
  this.interpret = function (s) {
    throw new Error("Interpret called on NoOpNode! Parent should not call NoOpNode.")
  }
}

function is(l, r) {
  return l == r
}

function isNot(l, r) {
  return l != r
}

function greaterThan(l, r) {
  return l > r
}

function lessThan(l, r) {
  return l < r
}

function and(l, r) {
  return l && r
}

function or(l, r) {
  return l || r
}

function isNotIn(arr, val) {
  return arr.indexOf(val) === -1
}

function isIn(arr, val) {
  return arr.indexOf(val) !== -1
}

function cleanLine(str){
  str = str.toLowerCase()
  str = str.replace(/[^\w\s]/g, "")
  str = str.replace(/^\s+|\s+$/g, "")
  str = str.replace(/\s{2,}/g, " ")
  return str
}

function printCleanConfig(config){
  config.expressions = Object.keys(config.expressions).reduce((exps, prop) => {
    exps[prop] = cleanLine(config.expressions[prop])
    return exps
  }, {})
  config.rules = config.rules.map(cleanLine)
  console.log(config)
}

module.exports.makeSyntaxTree = makeSyntaxTree
module.exports.printCleanConfig = printCleanConfig
