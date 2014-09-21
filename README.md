arrange.js — The most flexible javascript formatting library
==================================================

The library is in alpha state and needs more test and documentation before being used in a Production environment.

Quick Tour
--------------------------------------

Arrange.js create exactly one global variable: arrange.
Some example of what can format:

- **date**: `arrange("First node.js release: {:yyyy-mm-dd}", new Date(2014, 8, 24))` as `First node.js release: {:yyyy-mm-dd}`.
- **number**: `arrange("{0}, {1:B}, {1:X6}", 10, 0xc0de)` as `10, 1100000011011110, 00C0DE`.
- **json**: `arrange("{0:json}", { key: 'value' })` as `{"key":"value"}`.
- **arbitraryObjects**: `arrange("Package {name}<br>{description}",{name:'arrange.js',description:'The most versatile javascript formatting library'})` to `Package arrange.js<br>The most versatile javascript formatting library, supporting date, number, arbitrary objects, localization and more`

More example and documentation will be available soon.
