# Contributing

Contributions for the community are essential to create a great and better token standard. All suggestions are welcome and we will do our best to review them quickly and if satisfactory, to integrate them into the standard.

To optimize this process and increase the chances of accepting your suggestion, please follow these guidelines.

## General Guidelines

### Opening an issue

1. Try to be clear and concise.
2. Provide examples.
3. If applicable provide a proof of concept (PoC).

### Submitting Code

1. Make sure it is lint properly with:
   - `npm run js-lint` for javascript
   - `npm run sol-lint` for solidity
2. Provide tests for your code and ensure they run and pass with `npm run test`.
3. Make sure you don't break anything:
   - The solidity code must builds properly with `npm run build`
   - All existing tests must pass when called with `npm run test`
4. Keep things clean and organized:
   - Solidity code must be in `/contracts`
   - Tests must be in `/test`
5. Write a [good commit messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html):
   - Capitalized, short (50 chars or less) summary
   - Optionally, one blank line followed by a more detailed explanation
6. Submitted your changes via [a pull request (PR)](https://github.com/jacquesd/ERC777/pulls) from your fork of the repository and detail the changes in the description.
7. Make sure your pull request is up to date with [master](https://github.com/jacquesd/ERC777/commits/master).

## What should I do if....

### I have a suggestion but I can't implement it.

If you have a suggestion, but can't modify the reference implementation either because of lack of time or because you are unsure about how exactly to implement it, [open an issue](https://github.com/jacquesd/ERC777/issues). Try to explain your suggestion as clearly as possible and if you can, provide example scenarios.

### I have a suggestion and code to go with it.

Feel free to submit a pull request from a branch of your fork of the repository, preferably named something like: `feat-<your_suggestion>`.


### I don't have a suggestion but I found a bug or inconsistency.

Good catch! First [open an issue](https://github.com/jacquesd/ERC777/issues) explaining the bug and **provide a proof of concept (PoC)**.

Then if you are able to, indicate in the issue that you have a fix on the way and provide a [pull request](https://github.com/jacquesd/ERC777/pulls).

### I don't have a suggestion and I didn't find a bug but I want to help.

Thanks for your help!

If there is an [open issue](https://github.com/jacquesd/ERC777/issues?q=is%3Aopen+is%3Aissue) not assigned to anyone which you feel you can solve, indicate your interest and once assigned it's yours to fix!

At that point simply provide a [pull request](https://github.com/jacquesd/ERC777/pulls).

>Note: If you have a PR for an open issue which is not assigned to you, feel free to submit it too. But please understand that someone else may already be working on a fix and your PR may be refused.
