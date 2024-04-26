# @examples/playground-movies

This is a code example for the [Gentrace Playground SDK](https://www.npmjs.com/package/@gentrace/playground).

To run this example:

1. Install [Node.js](https://nodejs.org/) (which includes `npm`) if not yet installed. Confirm installation with this command:

```
npm --version
```

2. Install [pnpm](https://pnpm.io/)

```
npm install -g pnpm
```

3. Clone the repo, and go to the directory for this example.

```
git clone https://github.com/gentrace/gentrace-node.git
cd gentrace-node/examples/playground-movies/
```

4. In this directory, set up environment variables in a `.env` file. For example, the file could contain:

```
GENTRACE_API_KEY=...
OPENAI_KEY=...   
```

5. Install the package.

```
pnpm install
```

6. Build the package.

```
pnpm -w run build
```

7. Run the code file. 

```
pnpm run start index.ts
```