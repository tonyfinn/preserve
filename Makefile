VERSION != jq -r '.version' package.json
PACKAGE_NAME = target/preserve-${VERSION}.tar.gz

.PHONY: clean dist package

package: $(PACKAGE_NAME)

$(PACKAGE_NAME): dist/index.html node_modules
	npm run package

clean:
	npm run clean
	rm -rf node_modules/

check: node_modules
	npm run lint

node_modules:
	npm ci

dist: dist/index.html

dist/index.html: node_modules
	npm run build:prod
