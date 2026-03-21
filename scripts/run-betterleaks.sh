#!/usr/bin/env bash
set -euo pipefail

# この script 自身の場所から project root を解決する。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SARIF_DIR="$PROJECT_ROOT/sarif"
SARIF_PATH="$SARIF_DIR/betterleaks.sarif"
LAST_SARIF_PATH="$SARIF_DIR/betterleaks.last.sarif"
REPORT_PATH_IN_CONTAINER="/repo/sarif/betterleaks.sarif"

# Docker CLI と daemon の両方が使えることを事前に確認する。
if ! command -v docker >/dev/null 2>&1; then
  echo "This script requires Docker." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not available." >&2
  exit 1
fi

# 現在のレポートを 1 世代だけ退避してから新しい結果を出力する。
mkdir -p "$SARIF_DIR"

if [[ -f "$SARIF_PATH" ]]; then
  rm -f "$LAST_SARIF_PATH"
  mv "$SARIF_PATH" "$LAST_SARIF_PATH"
fi

# Betterleaks をコンテナで実行し、ホスト側ユーザ権限で SARIF を生成する。
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$PROJECT_ROOT:/repo:ro" \
  -v "$SARIF_DIR:/repo/sarif" \
  -w /repo \
  ghcr.io/betterleaks/betterleaks:latest \
  dir . --config /repo/.betterleaks.toml --report-format sarif --report-path "$REPORT_PATH_IN_CONTAINER"
