# ERC777
[![Build Status](https://img.shields.io/circleci/project/github/0xjac/ERC777/master.svg?style=flat-square&maxAge=3600 )](https://circleci.com/gh/0xjac/ERC777)
[![Coverage](https://img.shields.io/codecov/c/github/0xjac/ERC777/master.svg?style=flat-square&maxAge=3600)](https://codecov.io/gh/0xjac/ERC777)
[![License](https://img.shields.io/github/license/0xjac/ERC777.svg?style=flat-square&maxAge=3600)](https://github.com/0xjac/ERC777/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/erc777.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/erc777)
[![npm downloads](https://img.shields.io/npm/dt/erc777.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/erc777)
[![Solidity version](https://img.shields.io/badge/dynamic/json.svg?style=flat-square&maxAge=3600&label=Solidity&url=https%3A%2F%2Fraw.githubusercontent.com%2F0xjac%2FERC777%2Fmaster%2Fpackage-lock.json&query=%24.dependencies.solc.version&colorB=ff69b4&prefix=v)](https://solidity.readthedocs.io/en/v0.4.21/installing-solidity.html)
[![EIP](https://img.shields.io/badge/EIP-777-lightgrey.svg?style=flat-square&maxAge=3600)](https://eips.ethereum.org/EIPS/eip-777)
[![logo](https://img.shields.io/badge/-logo-C99D66.svg?style=flat-square&maxAge=3600&colorA=grey&logo=data:image/svg+xml;utf8,%253Csvg%2520xmlns='http://www.w3.org/2000/svg'%2520viewBox='0%25200%2520595.3%2520841.9'%253E%253Cpath%2520d='M410.1%2520329.9c20%25200%252039.1.1%252058.3-.1%25204.2%25200%25205.6.4%25204.8%25205.3-2.5%252014.1-4.4%252028.3-6.3%252042.5-.5%25203.6-2%25204.5-5.5%25204.5-28.3-.1-56.7%25200-85-.2-4%25200-6.2%25201.3-8.3%25204.6-9.6%252014.8-18.6%252030-26.7%252045.6-.5%25201-.9%25202.1-1.6%25203.7h5.9c35.5%25200%252071%2520.1%2520106.5-.1%25204.5%25200%25206.3.2%25205.3%25205.8-2.7%252014.2-4.6%252028.6-6.4%252043-.6%25204.4-2.1%25205.6-6.6%25205.6-41.2-.2-82.3-.1-123.5-.2-3.6%25200-5.1%25201.1-6.2%25204.5-13.7%252038.9-22.8%252078.9-28.7%2520119.6-2.8%252019.1-5.9%252038.2-8.6%252057.3-.5%25203.4-1.8%25203.8-4.7%25203.8-31.8-.1-63.7%25200-95.5-.1-1.5%25200-4.1%25201.4-3.5-2.6%25207.5-48.5%252013-97.3%252027.4-144.5%25203.8-12.5%25208-24.9%252012.8-37.9h-21.8c-14.7%25200-29.3-.2-44%2520.1-4.1.1-4.6-1.3-4.1-4.9%25202.5-15.4%25204.9-30.9%25207-46.4.5-3.4%25202.3-3%25204.5-3h79c2.2%25200%25204.1%25200%25205.4-2.5%25209.2-17.5%252020-34.1%252031.5-51.4h-5.8c-33.7%25200-67.3-.1-101%2520.1-4.4%25200-5.3-1.2-4.6-5.2%25202.3-14%25204.6-27.9%25206.3-42%2520.6-4.6%25202.5-5%25206.4-5%252044.2.1%252088.3%25200%2520132.5.2%25203.7%25200%25206-1.1%25208.3-4%252023.2-28.6%252048.2-55.6%252074.4-81.6%25201.2-1.2%25202.9-2%25204.4-3-.3-.5-.7-1-1-1.5h-5.3c-83.5%25200-167%25200-250.5.1-3.9%25200-5.7.1-4.8-5.2%25203.8-23.5%25207.1-47.1%252010.3-70.6.5-4.1%25202.5-4.1%25205.7-4.1%252082.3.1%2520164.7%25200%2520247%25200%252035.2%25200%252070.3.1%2520105.5-.1%25203.8%25200%25205%2520.5%25204.3%25204.8-3.7%252023.7-7.1%252047.4-10.4%252071.1-.4%25203-1.8%25205.2-3.9%25207.2-27.1%252026.8-53%252054.8-77.3%252084.3-.5.6-.9%25201.1-1.9%25202.5z'%2520fill='%2523fff'/%253E%253C/svg%253E)](logo)

*A New Advanced Token Standard for Ethereum*

This standard defines a new way to interact with a Token Contract. This standard takes advantage of [ERC820](https://github.com/ethereum/EIPs/issues/820).

> :warning: **This code has not been reviewed or audited.** :warning:
>
> Please review ***all*** the code you use in your token-related project including the code provided here.
> The code here is provided "*as is*" without warranty of any kind and The authors are not liable as [mentioned in the license](https://github.com/0xjac/ERC777/blob/master/LICENSE#L261-L301).

## Proposal
The official proposal can be found at: [eips.ethereum.org/EIPS/eip-777](https://eips.ethereum.org/EIPS/eip-777).

The original submission with discussion can be found at: [ethereum/eips/issues#777](https://github.com/ethereum/eips/issues/777) (initial pull request: [ethereum/eips/issues#907](https://github.com/ethereum/eips/issues/907)).

> You can suggest improvements to the **reference implementation** by submitting pull requests to this repository with modifications to [`eip-777.md`](eip-777.md).
>
> For suggestions related to the **standard**, please comment on the original submission at: [ethereum/eips/issues#777](https://github.com/ethereum/eips/issues/777)

## Specification

A copy of the specification can be found in this repository at [`eip-777.md`](eip-777.md).

## Reference Implementation
The reference implementation is available at: [contracts/examples/ReferenceToken.sol](contracts/examples/ReferenceToken.sol)

This repository including the specification and the reference implementation can be installed via `npm` with:

``` bash
npm install erc777
```

## Logo

> The logo MUST NOT be used to advertise, promote or associate in any way technology &ndash; such as tokens &ndash; which is not ERC777 compliant.

The official logo for the standard can be found in the official EIPs repository at: [/ethereum/EIPs/assets/eip-777/logo](https://github.com/ethereum/EIPs/tree/master/assets/eip-777/logo).  
Copies of the logo are provided here as well as a courtesy and can be found in the [logo](./logo) folder in [svg](logo/svg) and [png](logo/png) formats.

Variations exist in 5 colors as follow:

<table>
  <tr>
    <th>Image</th>
    <th><img src="logo/png/ERC-777-logo-beige-192px.png?raw=true" height="46px" align="top"></img></th>
    <th><img src="logo/png/ERC-777-logo-white-192px.png?raw=true" height="46px" align="top"></img></th>
    <th><img src="logo/png/ERC-777-logo-light_grey-192px.png?raw=true" height="46px" align="top"></img></th>
    <th><img src="logo/png/ERC-777-logo-dark_grey-192px.png?raw=true" height="46px" align="top"></img></th>
    <th><img src="logo/png/ERC-777-logo-black-192px.png?raw=true" height="46px" align="top"></img></th>
  </tr>
  <tr>
    <th>Color</th>
    <td>beige</td>
    <td>white</td>
    <td>light grey<br></td>
    <td>dark grey<br></td>
    <td>black</td>
  </tr>
  <tr>
    <th>Hex</th>
    <td><code>#C99D66</code></td>
    <td><code>#FFFFFF</code></td>
    <td><code>#EBEFF0</code></td>
    <td><code>#3C3C3D</code></td>
    <td><code>#000000</code></td>
  </tr>
</table>

> Thanks to Samantha Rosso [@Sauuman](https://github.com/Sauuman) for creating the logo.

## License
The standard definition as defined in [`eip-777.md`](eip-777.md) and the official [logo](logo) are placed in the public domain via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).


Apart from the standard definition (in [`eip-777.md`](eip-777.md)) and the [logo](logo), the content of this repository is licensed under the [Mozilla Public License ("MPL") 2.0](http://mozilla.org/MPL/2.0/), also included in this repository in the [LICENSE](LICENSE) file.

## Authors
 - Jordi Baylina [@jbaylina](https://github.com/jbaylina)
 - Jacques Dafflon [@0xjac](https://github.com/0xjac)
 - Thomas Shababi
