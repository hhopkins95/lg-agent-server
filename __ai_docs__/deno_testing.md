- Getting started

## Getting started

    - 
    - Installation
    - 
    - Making a Deno project
    - 
    - Set up your environment
    - 
    - Command line interface
- Fundamentals

## Fundamentals

- 
- TypeScript support
- 
- Node and npm support
- 
- Security and permissions
- 
- Modules and dependencies
- 
- deno.json and package.json
- 
- Standard Library
- 
- Web development
- 
- Testing
- 
- Debugging your code
- 
- Workspaces and monorepos
- 
- Linting and formatting
- 
- HTTP Server
- 
- Stability and releases
- Reference guides

## Reference guides

- CLI
    - deno add
    - deno bench
    - deno completions
    - deno check
    - deno compile
    - deno coverage
    - deno doc
    - deno eval
    - deno fmt
    - deno info
    - deno init
    - deno install
    - deno jupyter
    - deno lint
    - deno outdated
    - deno publish
    - deno lsp
    - deno remove
    - deno repl
    - deno run
    - deno serve
    - deno task
    - deno test
    - deno types
    - deno uninstall
    - deno upgrade
    - Unstable feature flags
- 
- Deno APIs
- 
- Web APIs
- 
- Node APIs
- 
- Configuring TypeScript
- 
- Continuous integration
- 
- Environment variables
- 
- Deno & VS Code
- 
- Using JSX and React
- 
- Testing code in docs
- 
- WebAssembly
- 
- Deno 1.x to 2.x Migration Guide
- 
- LSP integration
- Tutorials

## Tutorials

- 
- Hello World
- 
- Fetch and stream data
- 
- Executable scripts
- 
- Updating from CommonJS to ESM
- 
- React with deno.json
- 
- React with package.json
- 
- Build a Next.js App
- 
- Build a Vue.js App
- 
- Connecting to databases
- More tutorials
    - Write a file server
    - Creating a subprocess
    - Handle OS signals
    - File system events
    - Module metadata
    - How to Deploy Deno to AWS Lambda
    - Deploy Deno to Amazon Lightsail
    - Deploying Deno to Cloudflare Workers
    - How to deploy Deno to Digital Ocean
    - How to deploy to Google Cloud Run
    - How to deploy Deno on Kinsta
    - How to use Apollo with Deno
    - How to use Express with Deno
    - How to use Mongoose with Deno
    - How to use MySQL2 with Deno
    - How to use Planetscale with Deno
    - How to create a RESTful API with Prisma and Oak
    - How to use Redis with Deno
    - File-based routing
- Contributing and support

## Contributing and support

- Contributing to Deno
    - Internal Details
    - Building deno from Source
    - Profiling
    - Release Schedule
    - Deno Style Guide
    - Web Platform Test
    - Contributing an example
- 
- Where to get help

- Runtime
- 
- Fundamentals
- 
- Testing

- Writing Tests
- Running Tests
- Test Steps
- Command line filtering
    - Filtering by string
    - Filtering by Pattern
    - Including and excluding test files in the configuration file
- Test definition selection

- Ignoring/Skipping Tests
- Only Run Specific Tests
- Failing fast
- Reporters
- Spying, mocking (test doubles), stubbing and faking time
- Coverage
- Behavior-Driven Development
- Documentation Tests

- Example code blocks
- Exported items are automatically imported
- Skipping code blocks
- Sanitizers

- Resource sanitizer
- Async operation sanitizer
- Exit sanitizer
- Snapshot testing

# Testing

Deno provides a built-in test runner for writing and running tests in both
JavaScript and TypeScript. This makes it easy to ensure your code is reliable
and functions as expected without needing to install any additional dependencies
or tools. The deno test runner allows you fine-grained control over
permissions for each test, ensuring that code does not do anything unexpected.

In addition to the built-in test runner, you can also use other test runners
from the JS ecosystem, such as Jest, Mocha, or AVA, with Deno. We will not cover
these in this document however.

## Writing Tests Jump to heading#

To define a test in Deno, you use the Deno.test() function. Here are some
examples:

If you prefer a "jest-like" expect style of assertions, the Deno standard
library provides an expect function that can be
used in place of assertEquals:

## Running Tests Jump to heading#

To run your tests, use the deno test
subcommand.

If run without a file name or directory name, this subcommand will automatically
find and execute all tests in the current directory (recursively) that match the
glob {*\_,*.,}test.{ts, tsx, mts, js, mjs, jsx}.

## Test Steps Jump to heading#

Deno also supports test steps, which allow you to break down tests into smaller,
manageable parts. This is useful for setup and teardown operations within a
test:

## Command line filtering Jump to heading#

Deno allows you to run specific tests or groups of tests using the --filter
option on the command line. This option accepts either a string or a pattern to
match test names. Filtering does not affect steps; if a test name matches the
filter, all of its steps are executed.

Consider the following tests:

### Filtering by string Jump to heading#

To run all tests that contain the word "my" in their names, use:

This command will execute my-test because it contains the word "my".

### Filtering by Pattern Jump to heading#

To run tests that match a specific pattern, use:

This command will run test-1 and test-2 because they match the pattern
test-* followed by a digit.

To indicate that you are using a pattern (regular expression), wrap your filter
value with forward slashes /, much like JavaScript’s syntax for regular
expressions.

### Including and excluding test files in the configuration file Jump to heading#

You can also filter tests by specifying paths to include or exclude in the
Deno configuration file.

For example, if you want to only test src/fetch\_test.ts and
src/signal\_test.ts and exclude everything in out/:

Or more likely:

## Test definition selection Jump to heading#

Deno provides two options for selecting tests within the test definitions
themselves: ignoring tests and focusing on specific tests.

### Ignoring/Skipping Tests Jump to heading#

You can ignore certain tests based on specific conditions using the ignore
boolean in the test definition. If ignore is set to true, the test will be
skipped. This is useful, for example, if you only want a test to run on a
specific operating system.

If you want to ignore a test without passing any conditions, you can use the
ignore() function from the Deno.test object:

### Only Run Specific Tests Jump to heading#

If you want to focus on a particular test and ignore the rest, you can use the
only option. This tells the test runner to run only the tests with only set
to true. Multiple tests can have this option set. However, if any test is
flagged with only, the overall test run will always fail, as this is intended to
be a temporary measure for debugging.

or

## Failing fast Jump to heading#

If you have a long-running test suite and wish for it to stop on the first
failure, you can specify the --fail-fast flag when running the suite.

This will cause the test runner to stop execution after the first test failure.

## Reporters Jump to heading#

Deno includes three built-in reporters to format test output:

- pretty (default): Provides a detailed and readable output.
- dot: Offers a concise output, useful for quickly seeing test results.
- junit: Produces output in JUnit XML format, which is useful for integrating
with CI/CD tools.

You can specify which reporter to use with the --reporter flag:

Additionally, you can write the JUnit report to a file while still getting
human-readable output in the terminal by using the --junit-path flag:

## Spying, mocking (test doubles), stubbing and faking time Jump to heading#

The Deno Standard Library provides a
set of functions to help you write tests that involve spying, mocking, and
stubbing. Check out the
@std/testing documentation on JSR for more
information on each of these utilities.

## Coverage Jump to heading#

Deno will collect test coverage into a directory for your code if you specify
the --coverage flag when starting deno test. This coverage information is
acquired directly from the V8 JavaScript engine, ensuring high accuracy.

This can then be further processed from the internal format into well known
formats like lcov with the deno coverage
tool.

## Behavior-Driven Development Jump to heading#

With the @std/testing/bdd module you
can write your tests in a familiar format for grouping tests and adding
setup/teardown hooks used by other JavaScript testing frameworks like Jasmine,
Jest, and Mocha.

The describe function creates a block that groups together several related
tests. The it function registers an individual test case. For example:

Check out the documentation on JSR for
more information on these functions and hooks.

## Documentation Tests Jump to heading#

Deno allows you to evaluate code snippets written in JSDoc or markdown files.
This ensures the examples in your documentation are up-to-date and functional.

### Example code blocks Jump to heading#

The triple backticks mark the start and end of code blocks, the language is
determined by the language identifier attribute which may be one of the
following:

- js
- javascript
- mjs
- cjs
- jsx
- ts
- typescript
- mts
- cts
- tsx

If no language identifier is specified then the language is inferred from media
type of the source document that the code block is extracted from.

The above command will extract this example, turn it into a pseudo test case
that looks like below:

and then run it as a standalone module living in the same directory as the
module being documented.

If you want to type-check your code snippets in JSDoc and markdown files without
actually running them, you can use deno check
command with --doc option (for JSDoc) or with --doc-only option (for
markdown) instead.

### Exported items are automatically imported Jump to heading#

Looking at the generated test code above, you will notice that it includes the
import statement to import the add function even though the original code
block does not have it. When documenting a module, any items exported from the
module are automatically included in the generated test code using the same
name.

Let's say we have the following module:

This will get converted to the following test case:

### Skipping code blocks Jump to heading#

You can skip the evaluation of code blocks by adding the ignore attribute.

## Sanitizers Jump to heading#

The test runner offers several sanitizers to ensure that the test behaves in a
reasonable and expected way.

### Resource sanitizer Jump to heading#

The resource sanitizer ensures that all I/O resources created during a test are
closed, to prevent leaks.

I/O resources are things like Deno.FsFile handles, network connections,
fetch bodies, timers, and other resources that are not automatically garbage
collected.

You should always close resources when you are done with them. For example, to
close a file:

To close a network connection:

To close a fetch body:

This sanitizer is enabled by default, but can be disabled in this test with
sanitizeResources: false:

### Async operation sanitizer Jump to heading#

The async operation sanitizer ensures that all async operations started in a
test are completed before the test ends. This is important because if an async
operation is not awaited, the test will end before the operation is completed,
and the test will be marked as successful even if the operation may have
actually failed.

You should always await all async operations in your tests. For example:

This sanitizer is enabled by default, but can be disabled with
sanitizeOps: false:

### Exit sanitizer Jump to heading#

The exit sanitizer ensures that tested code doesn’t call Deno.exit(), which
could signal a false test success.

This sanitizer is enabled by default, but can be disabled with
sanitizeExit: false.

## Snapshot testing Jump to heading#

The Deno Standard Library includes a
snapshot module that allows
developers to write tests by comparing values against reference snapshots. These
snapshots are serialized representations of the original values and are stored
alongside the test files.

Snapshot testing enables catching a wide array of bugs with very little code. It
is particularly helpful in situations where it is difficult to precisely express
what should be asserted, without requiring a prohibitive amount of code, or
where the assertions a test makes are expected to change often.

## Did you find what you needed?

Thank you! Feedback received. ✅

- Writing Tests
- Running Tests
- Test Steps
- Command line filtering
    - Filtering by string
    - Filtering by Pattern
    - Including and excluding test files in the configuration file
- Test definition selection

- Ignoring/Skipping Tests
- Only Run Specific Tests
- Failing fast
- Reporters
- Spying, mocking (test doubles), stubbing and faking time
- Coverage
- Behavior-Driven Development
- Documentation Tests

- Example code blocks
- Exported items are automatically imported
- Skipping code blocks
- Sanitizers

- Resource sanitizer
- Async operation sanitizer
- Exit sanitizer
- Snapshot testing

### Deno Docs

- Deno Runtime
- Deno Deploy
- Deno Subhosting
- Examples
- Standard Library

### Community

- Discord
- GitHub
- Twitter
- YouTube
- Newsletter

### Help & Feedback

- Community Support
- Deploy System Status
- Deploy Feedback
- Report a Problem

### Company

- Blog
- Careers
- Merch
- Privacy Policy

Copyright © 2024 the Deno authors.