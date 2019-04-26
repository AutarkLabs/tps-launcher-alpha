Hacks
=====

We've had to do some not so nice things to make things work, or work better :cry::

- Pinned `web3.js` to `1.0.0-beta.33`: [`wss` is broken in `1.0.0-beta.34`](https://github.com/ethereum/web3.js/issues/1559)
    - Forced to also pin `web3-utils` to `1.0.0-beta.33`
    - Forced to also pin `bn.js` to `4.11.6` as `web3.js` has pinned this dependency
- Forced to add and pin `underscore` to `1.8.3` to dedupe this instance of `underscore`.
    - Both `web3.js` and `ethereum-ens` use `underscore`, but require different versions, and it seems node likes to hoist the higher version number rather than the more dependend-upon one
