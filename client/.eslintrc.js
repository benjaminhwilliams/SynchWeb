module.exports = {
    extends: [
        'eslint:recommended',
        "plugin:backbone/recommended"
      ],
      "ignorePatterns": ["temp.js", "**/vendor/**"],
      rules: {
        // override/add rules settings here, such as:
        // 'vue/no-unused-vars': 'error'
      },
      env: {
        amd: true // registers globals for define and require
      },
}