#!/bin/bash

find . -type f -name "*.js" -exec echo {} && jshint --verbose --config .jshintrc {} \;

find . -type f -name "*.js" -exec echo {} && jscs --verbose --config .jscsrc {} \;
