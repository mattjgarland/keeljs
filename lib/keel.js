define([], function() {

    function State(SyntaxTree){
        this.SyntaxTree = SyntaxTree;
        this.data = {};
        this.history = [];
        this.exps = {};
        this.update_rules = [];
        this.after_update = [];
    }
    State.prototype.set = function(name, val){
        this.data[name] = val || null;
    };
    State.prototype.get = function(name, last_value){
        if (last_value){
            if (this.history.length == 0) {
                return undefined;
            } else {
                return this.history[this.history.length-1][name];
            }
        } else {
            return this.data[name];
        }
    };
    State.prototype.has = function(name){
        return this.data.hasOwnProperty(name);
    }
    State.prototype.exp = function(key, str){
        this.exps[key] = new this.SyntaxTree(str, this);
    };
    State.prototype.hasExp = function(key){
        return this.exps.hasOwnProperty(key);
    };
    State.prototype.getExp = function(key){
        return this.exps[key];
    }
    State.prototype.rule = function(str){
        this.update_rules.push(new this.SyntaxTree(str, this));
    };
    State.prototype.on = function (str, handler, props){
        var exp = this.hasExp(str)? this.getExp(str) : new this.SyntaxTree(str, this);
        this.after_update.push({exp:exp, handler:handler, props:props});
    }
    State.prototype.update = function(obj){
        var self = this;
        this.history.push(copy(obj));
        transfer(obj, this.data);
        this.update_rules.forEach(function(exp){
            exp.interpret(self);
        });
        this.after_update.forEach(function(trigger){
            if(trigger.exp.interpret(self)){
                var data = {};
                trigger.props.forEach(function(prop){
                    data[prop] = self.get(prop);
                });
                trigger.handler(data);
            }
        });
    }
    return State;

    function copy(obj){
       return JSON.parse(JSON.stringify(obj));
    }
    function transfer(from, to){
         for (var prop in from){
            to[prop] = from[prop];
        }
    }
});




