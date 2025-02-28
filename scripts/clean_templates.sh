#!/bin/bash
BASEDIR=$(dirname $0)
ts-node --prefer-ts-exts ${BASEDIR}/clean_templates.ts
