<!-- This Source Code Form is subject to the terms of the Mozilla Public
     License, v. 2.0. If a copy of the MPL was not distributed with this
     file, You can obtain one at http://mozilla.org/MPL/2.0/. -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Broaden the Solidity version pragma to ^0.4.21
- Set cache of shield.io badges to 1h
- Use master/devel branch instead of master
- Cleanup CONTRIBUTING.md
- Make the reference implementation use the base token

### Added
- [README]: EIP badge with link to the official EIP
- Coverage information with minimum threshold of 95%
- Integration of coverage with CI and reporting via codecov.io
- Coverage badge
- Contract deployment in test using web3.js 1.0.0
- More tests
- Add Base Token (pure ERC77 and ERC20 compat.) to let others easily implement their token.

### Changed
- Fix typos in [README]
- Use cleaner imports in Solidity

## [0.1.1] - 2018-05-07

### Added
- Changelog based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Include built files, contracts and logo in npm package
- Logo badge in the [README]
- Solidity badge in the [README]
- Missing License header
- Npm installation instructions in [README]
- Solidty language linting

### Changed
- Update EIP specification with links to official page
- Use Solidity 0.4.21
- Use `truffle` instead of `solcpiler`
- Use `openzeppelin-solidity` instead of `giveth-common-contracts`
- Use CircleCI instead of Travis
- Fix version badge in [README]
- Fix links in [README]

## [0.1.0] - 2018-03-15

### Added
- New npm package: `erc777`

### Changed
- Renamed repo from eip777 to ERC777


### Removed
- Deprecated npm package `eip777` in favor of `erc777`

[Unreleased]: https://github.com/jacquesd/ERC777/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/jacquesd/ERC777/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jacquesd/ERC777/compare/v0.0.8...v0.1.0
[README]: README.md
