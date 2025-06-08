const chalk = require('chalk');

console.log('Testing chalk colors:');
console.log(chalk.red('This should be red'));
console.log(chalk.cyan('This should be cyan'));
console.log(chalk.yellow('This should be yellow'));
console.log(chalk.gray('This should be gray'));

// Test inside boxen
const boxen = require('boxen');
console.log('\nTesting chalk inside boxen:');
console.log(boxen(chalk.cyan('This text should be cyan inside a box'), { padding: 1 }));