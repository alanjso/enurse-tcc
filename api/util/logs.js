const chalk = require('chalk')
const error = (text) => {
    console.log(chalk.red(text))
}
const success = (text) => {
    console.log(chalk.green(text))
}
const warning = (text) => {
    console.log(chalk.yellow(text))
}
const log = (text) => {
    console.log(chalk.blue(text))
}

module.exports = {
    error,success,warning,log
}