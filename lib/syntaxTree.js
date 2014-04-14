 define([], function() {

   function SyntaxTree(input, state) {
    //CONFIG
    var operands = ["then", "equals", "or", "and", "was", "was not", "is", "is not", "is now", "has changed", "greater than", "less than"];
    var to_delete = ["if"];
    //CLEAN UP INPUT STRING
    var str = input.toLowerCase();
    str = str.replace(/[^\w\s]/g, "");
    str = str.replace(/^\s+|\s+$/g, "");
    str = str.replace(/\s{2,}/g, " ");
    //CLEAN UP WORDS
    var words = str.split(" ");
    //'if' is superfluous, only 'then' counts
    words = words.filter(function(w) {
        return isNotIn(to_delete, w);
    });
    //BUFFERS
    var expressions = [];
    var exp;
    var match = [];
    //LONGEST MATCH
    while (words.length) {
        match.unshift(words.pop());
        var len = match.length, rest = null;
        //DIVIDE WORDS BETWEEN MATCH on LEFT AND REST ON RIGHT
        //Dividing line starts at right to prioritize longest matches
        //KEEP MOVING THE DIVIDING LINE LEFT
        while (len--) {
            var str = match.slice(0, len + 1).join(" ");
            var rest = len == match.length - 1 ? null : match.slice(len + 1).join(" ");
            //CHECK FOR MATCH
            var inProps = state.has(str);
            var inOperands = isIn(operands, str);
            var inExps = state.hasExp(str);
            if (inProps || inOperands || inExps) {
                //CLEAR FOR NEXT MATCH
                match = [];
                //REST MUST BE A VALUE NODE SINCE IT HAS NOT BEEN CHANGED INTO EXPRESSION
                if (rest) expressions.unshift(new ValueNode(rest));
                if (inOperands){
                    exp = makeOperandNode(str);
                } else if (inProps){
                    exp = new VarNode(str);
                } else{
                    exp = state.getExp(str);
                }
                //Add children properties if exp is not preexisiting
                exp.left_child = exp.left_child || null;
                exp.right_child = exp.right_child || null;
                expressions.unshift(exp);
                break;
            }
        }
        //IF STILL MATCH REMAINDER, THERE IS AN INITIAL VALUE NODE
        //if it is still here it can't be a VarNode
        //since it is the first group, it can't be an Operand node
        if (words.length == 0 && match.length > 0) {
            expressions.unshift(new ValueNode(match.join(" ")));
        }
    }
    //ENSURE EXPRESSIONS ARRAY HAS SERIES OF TRIPLETS
    for (var k = 0; k<expressions.length; k++){;
        exp = expressions[k];
        //Insert NoOpNode after HasChangedNode for a triplet (only if not preexising exp)
        if (exp.type == "has changed" && exp.left_child == null){
            expressions.splice(k+1, 0, new NoOpNode());
            k++;
        }
    }
    //PROCESS OPERAND EXPRESSIONS FROM LEAST TO MOST IMPORTANT OPERAND
    while (expressions.length > 1) {
        //start with the least important operand 
        var exp_type = operands.pop();
        var per_operand = expressions.filter(function(exp) {
            return exp.type === exp_type && exp.left_child == null;
        });
        //walk expressesions, grabbing left and right nodes for children....
        for (var i = 0; i < per_operand.length; i++) {
            exp = per_operand[i];
            var start = expressions.indexOf(exp);
            var triplet = expressions.splice(start - 1, 3, exp);
            exp.left_child = triplet[0];
            exp.right_child = triplet[2];
        }
    }
    //RETURN THE TOP OF THE SYNTAX TREE, WHICH IS THE ONLY EXPRESSION LEFT IN EXPRESSION ARRAY
    return first(expressions);
}

    return SyntaxTree;

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
            if (w == "equals") return new EqualsNode();
            if (w == "then") return new ThenNode();
            if (w == "has changed") return new HasChangedNode();
            console.log("ERROR: OPERAND EXPRESSION TYPE NOT FOUND!", w)
            return null;
        }
    //SYNTAX TREE NODES
    function ValueNode(val) {
        this.type = "value";
        var cast_val = val;
        if (val == "true" || val == "false") {
            cast_val = val == "true";
        } else if (/^[0-9]+$/.test(val)) {
            cast_val = parseInt(val)
        } else if (val == "null"){
            cast_val = null;
        }
        this.val = cast_val;
        this.interpret = function(state) {
            return this.val;
        }
    };
    function VarNode(prop) {
        this.type = "prop";
        this.prop = prop;
        this.interpret = function(state, prev_val) {
            return state.get(this.prop, prev_val);
        };
    };
    function IsNowNode(prop) {
        this.type = "is now";
        this.interpret = function(state) {
            var old=this.left_child.interpret(state, true);
            var now=this.left_child.interpret(state);
            var val=this.right_child.interpret(state);
            return old!=now && now==val;
        };
    }
    function CompareNode(type, compare_fun) {
        this.type = type;
        this.interpret = function(state) {
            return compare_fun(this.left_child.interpret(state), this.right_child.interpret(state));
        }
    };
    function WasCompareNode(type, compare_fun) {
        this.type = type;
        this.interpret = function(state) {
            return compare_fun(this.left_child.interpret(state, true), this.right_child.interpret(state));
        }
    };
    function EqualsNode() {
        this.type = "equals";
        this.interpret = function(state) {
            return state.set(this.left_child.prop, this.right_child.interpret(state));
        }
    };
    function ThenNode() {
        this.type = "then";
        this.interpret = function(state) {
            if (this.left_child.interpret(state)) {
                return this.right_child.interpret(state);
            }
        }
    };
    function HasChangedNode(){
        this.type = "has changed";
        this.interpret = function(state){
            var then = this.left_child.interpret(state, true);
            var now = this.left_child.interpret(state);
            return now != then;
        }
    }
    function NoOpNode() {
        this.type = "noOp";
        this.interpret = function(state) {
            console.log("Interpret called on NoOpNode! NoOpNodes' interpert method should not be called by their parent node.");
        }
    }
    //OPERAND UTILITIES
    function is(l, r) {
        //console.log("compare", l, r, l == r)
        return l == r;
    };
    function isNot(l, r) {
        return l != r;
    };
    function greaterThan(l, r) {
        return l > r;
    };
    function lessThan(l, r) {
        return l < r;
    };
    function and(l, r) {
        //console.log("and", l, r, l && r);
        return l && r;
    };
    function or(l, r) {
        return l || r;
    };
    //ARRAY UTILITIES
    function isNotIn(arr, val) {
        return arr.indexOf(val) == -1;
    };
    function isIn(arr, val) {
        return arr.indexOf(val) != -1;
    };
    function first(arr) {
        return arr[0];
    };
    function last(arr) {
        return arr[arr.length - 1];
    };

});


