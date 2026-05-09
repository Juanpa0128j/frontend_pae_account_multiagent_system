.PHONY: help install dev build test test-watch test-coverage lint format format-check type-check clean ci

# Default target
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Setup"
	@echo "  install        Install all dependencies (pnpm install)"
	@echo ""
	@echo "Development"
	@echo "  dev            Run Next.js development server (port 3000)"
	@echo "  build          Build production bundle"
	@echo ""
	@echo "Testing"
	@echo "  test           Run all unit tests (one pass)"
	@echo "  test-watch     Run tests in watch mode"
	@echo "  test-coverage  Run tests with coverage report (gate: 80%)"
	@echo ""
	@echo "Lint & Format"
	@echo "  lint           Run ESLint"
	@echo "  format         Format code with Prettier"
	@echo "  format-check   Check formatting without writing (CI)"
	@echo "  type-check     Run TypeScript compiler check (tsc --noEmit)"
	@echo ""
	@echo "Cleanup"
	@echo "  clean          Remove .next, node_modules/.cache, coverage"

# ── Setup ─────────────────────────────────────────────────────────────────────

install:
	pnpm install

# ── Development ───────────────────────────────────────────────────────────────

dev:
	pnpm dev

build:
	pnpm build

# ── Testing ───────────────────────────────────────────────────────────────────

test:
	pnpm test

test-watch:
	pnpm test:watch

test-coverage:
	pnpm test:coverage

# ── Lint & Format ─────────────────────────────────────────────────────────────

lint:
	pnpm lint

format:
	pnpm format

format-check:
	pnpm format:check

type-check:
	pnpm tsc --noEmit

# ── CI (mirrors .github/workflows/ci.yml order) ───────────────────────────────

ci: format-check type-check test test-coverage lint build

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	rm -rf .next coverage node_modules/.cache
