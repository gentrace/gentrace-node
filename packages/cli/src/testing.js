import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

yargs(hideBin(process.argv))
  .command(
    'greet [name]',
    'greet a user',
    (yargs) => {
      yargs
        .positional('name', {
          describe: 'Name to greet',
          default: 'world'
        })
        .option('e', {
          alias: 'excited',
          describe: 'Express excitement in the greeting',
          type: 'boolean'
        });
    },
    (argv) => {
      const greeting = argv.excited ? 'Hello, ' + argv.name + '!' : 'Hi, ' + argv.name + '.';
      console.log(greeting);
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;
