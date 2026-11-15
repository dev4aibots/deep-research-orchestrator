.PHONY: test typecheck dev build

test:
	python main.py
	cd demo && npm test

typecheck:
	cd demo && npm run typecheck

dev:
	cd demo && npm run dev

build:
	cd demo && npm ci && npm run build
