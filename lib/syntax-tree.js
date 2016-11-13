/*
makeFunctionTree takes a sentence input (line), transforms it into a syntax tree, then returns the top of that tree. The top is a node which implements interpret, which takes state (s) and recursively interprets the whole tree. 
1. Explode the line and get rid of "if" (blacklisted because "then" suffices).
2. Convert each word or word set into a node.
  a. Start from the end and keep adding words to match array. 
  b. After each addition, look for a match from the beginning of the match array. 
  c. A match is made for 1. a data field (VarNode) 2. an operand node (AndNode etc) or an arbitray expression passed into the syntax tree. 
  d. If the match has any leftovers, they are converted to a ValueNode. 
  e. A leftover first word becomes a ValueNode.
3. The next phase requires that every operand node has a left and a right child, so make sure that is the case (add one to the right of "has changed").
4. Keep iterating over the resulting nodes:
  a. Identify the weakest operand.
  b. Find matching operand nodes. 
  c. Make the right and left nodes children of the operand node and take them out of the array.
  At the end of process, only the strongest operand node is left in the array, so return that "top of tree" node.
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
      let inExps = exps.hasOwnProperty(str)

      if (inProps || inOperands || inExps) {
        if (rest) {
          nodes.unshift(new ValueNode(rest))
        }

        if (inOperands) {
          node = makeOperandNode(str, nodes)
        } else if (inProps) {
          node = new VarNode(str)
        } else {
          node = exps[str]
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
    if (isIn(getAddRight(), node.type) && !node.lChild) {
      nodes.splice(i + 1, 0, new NoOpNode())
      i++
    }
  }

  for (var i = 0; i < nodes.length; i++) {
    let node = nodes[i]
    if (isIn(getSwapRight(), node.type) && !node.lChild) {
      let nextNode = nodes[i + 1]
      nodes[i + 1] = node
      nodes[i] = nextNode
      i++
    }
  }

  for (var i = 0; i < nodes.length; i++) {
    let node = nodes[i]
    if (isIn(getSwapRightAndAddRight(), node.type)  && !node.lChild) {
      let nextNode = nodes[i + 1]
      nodes[i + 1] = node
      nodes[i] = nextNode
      nodes.splice(i + 2, 0, new NoOpNode())
      i+= 2
    }
  }

  for (var i = 0; i < nodes.length; i++) {
    let node = nodes[i]
    if (isIn(getSurroundIfChildren(), node.type) && node.lChild) {
      nodes.splice(i, 1, new NoOpNode(), node, new NoOpNode())
      i+= 2
    }
  }
}

function nodesToTree(nodes) {
  const operands = getOperands()
  const maxLoops = 100
  let loop = 0

  nodes.forEach(node => node.treed = false)
  while (nodes.length > 1) {
    loop++
    if (loop > maxLoops){
      throw new Error(`Cannot resolve tree ${nodes.map(node => node.type)} within ${maxLoops} loops.`)
    }

    let operand = operands.pop()
    let operandNodes = nodes.filter(node => node.type === operand && !node.treed)
    operandNodes.sort((a, b) => {
      if(a.lChild && !b.leftChild){
        return 1
      } else if (!a.lChild && b.lChild){
        return -1
      }
      return 0
    })

    if (operandNodes.length){
      for (let i = 0; i <operandNodes.length; i++) {
        let node = operandNodes[i]
        let start = nodes.indexOf(node) 
        let [lChild, , rChild] = nodes.splice(start - 1, 3, node)
        if (!node.lChild){
          node.lChild = lChild
          node.rChild = rChild
          if (isIn(operandNodes, lChild)){
            i++
          }
          if (isIn(operandNodes, rChild)){
            i++
          }
        }
        node.treed = true
      }
    }
    
  }
  return nodes.pop()
}

function makeOperandNode(w, nodes) {
  if (w == "is") return new CompareNode(w, is)
  if (w == "is not") return new CompareNode(w, isNot)
  if (w == "is now") return new IsNowNode(w)
  if (w == "is not now") return new IsNotNowNode(w)
  if (w == "was") return new WasCompareNode(w, is)
  if (w == "was not") return new WasCompareNode(w, isNot)
  if (w == "greater than") return new CompareNode(w, greaterThan)
  if (w == "less than") return new CompareNode(w, lessThan)
  if (w == "and") return new AndNode()
  if (w == "or") return new CompareNode(w, or)
  if (w == "set") return new SetNode()
  if (w == "then") return new ThenNode()
  if (w == "has changed") return new HasChangedNode()
  if (w == "has not changed") return new HasNotChangedNode()
  if (w == "inc") return new IncrementNode()
  throw new Error("Node type not found! " + w)
}

function getOperands() {
  return ["then", "or", "and", "set", "inc", "was", "was not", "is", "is not", "is now", "is not now", "has changed", "has not changed", "greater than", "less than"]
}

function getWordBlacklist() {
  return ["if"]
}

function getAddRight() {
  return ["has changed", "has not changed"]
}

function getSurroundIfChildren() {
  return ["set", "inc", "has changed", "has not changed"]
}

function getSwapRight() {
  return ["set"]
}

function getSwapRightAndAddRight() {
  return ["inc"]
}

function getNonBoolOperands(){
  return ["set", "inc"]
}

function ValueNode(val) {
  this.type = "value"
  var castVal = val
  if (val === "true" || val === "false") {
    castVal = val === "true"
  } else if (/^[0-9]+$/.test(val)) {
    castVal = parseInt(val)
  } else if (val === "null") {
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
  this.interpret = function (s) {
    return s.get(this.prop)
  }
}

function IsNowNode() {
  this.type = "is now"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s.previous())
    var now = this.lChild.interpret(s)
    var val = this.rChild.interpret(s)
    return then !== now && now === val
  }
}

function IsNotNowNode() {
  this.type = "is not now"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s.previous())
    var now = this.lChild.interpret(s)
    var val = this.rChild.interpret(s)
    return then !== now && then === val
  }
}

function AndNode(){
  this.type = "and"
  this.interpret = function(s){
    if (isIn(getNonBoolOperands(), this.lChild.type)){
        this.lChild.interpret(s)
        this.rChild.interpret(s)
    } else {
        return this.lChild.interpret(s) && this.rChild.interpret(s)
    }
  }
}

function CompareNode(type, compare) {
  this.type = type
  this.interpret = function (s) {
    return compare(this.lChild.interpret(s), this.rChild.interpret(s))
  }
}

function WasCompareNode(type, compare) {
  this.type = type
  this.interpret = function (s) {
    return compare(this.lChild.interpret(s.previous()), this.rChild.interpret(s))
  }
}

function SetNode() {
  this.type = "set"
  this.interpret = function (s) {
    return s.set(this.lChild.prop, this.rChild.interpret(s))
  }
}

function IncrementNode() {
  this.type = "inc"
  this.interpret = function (s) {
    return s.set(this.lChild.prop, this.lChild.interpret(s) + 1)
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

function HasChangedNode() {
  this.type = "has changed"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s.previous())
    var now = this.lChild.interpret(s)
    return now !== then
  }
}

function HasNotChangedNode() {
  this.type = "has not changed"
  this.interpret = function (s) {
    var then = this.lChild.interpret(s.previous())
    var now = this.lChild.interpret(s)
    return now === then
  }
}

function NoOpNode() {
  this.type = "noOp"
  this.interpret = function (s) {
    throw new Error("Interpret called on NoOpNode! Parent should not call NoOpNode.")
  }
}

function is(l, r) {
  return l === r
}

function isNot(l, r) {
  return l !== r
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
