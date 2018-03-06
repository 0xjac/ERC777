module.exports = {
  "extends": [
    "standard",
    "plugin:promise/recommended"
  ],
  "plugins": [
    "promise"
  ],
  "env": {
    "browser" : true,
    "node"    : true,
    "mocha"   : true,
    "jest"    : true
  },
  "globals" : {
    "artifacts": false,
    "contract": false,
    "assert": false,
    "web3": false
  },
  "rules": {

    // Strict mode
    "strict": ["error", "global"],

    // Code style
    "indent": ["error", 2],
    "quotes": ["error", "single", {"avoidEscape": true}],
    "semi": ["error", "always"],
    "space-before-function-paren": ["error", {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always"
    }],
    "no-use-before-define": 0,
    "eqeqeq": ["error", "smart"],
    "dot-notation": ["error", {"allowKeywords": true, "allowPattern": ""}],
    "no-redeclare": ["error", {"builtinGlobals": true}],
    "no-trailing-spaces": ["error", { "skipBlankLines": true }],
    "eol-last": 1,
    "comma-spacing": ["error", {"before": false, "after": true}],
    "camelcase": ["error", {"properties": "always"}],
    "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    "comma-dangle": [1, "always-multiline"],
    "no-dupe-args": "error",
    "no-dupe-keys": "error",
    "no-debugger": 0,
    "no-undef": "error",
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", 80, 2],
    "generator-star-spacing": ["error", "before"],
    "promise/avoid-new": 0,
    "promise/always-return": 0
  }
};
