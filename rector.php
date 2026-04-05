<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/src',
        __DIR__ . '/tests',
    ])
    // Verify the codebase is compatible with the declared PHP minimum (8.2).
    // Deliberately no opinionated style/quality sets (CODE_QUALITY, TYPE_DECLARATION,
    // DEAD_CODE, EARLY_RETURN) – those belong in a separate "rector:fix" workflow,
    // not in a blocking CI gate.
    ->withPhpSets(php82: true);
