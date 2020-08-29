srcdir = .
NPM = npm
INSTALL = install
INSTALL_PROGRAM = ${INSTALL}
INSTALL_DATA = ${INSTALL} -m 644
prefix = /usr/local
datarootdir = ${prefix}/share
webappsdir = ${datarootdir}/webapps
INSTALL_LOCATION = ${DESTDIR}${webappsdir}/preserve

VERSION != jq -r '.version' package.json
PACKAGE_NAME = ${srcdir}/target/preserve-${VERSION}.tar.gz

.PHONY: clean dist package install

package: $(PACKAGE_NAME)

$(PACKAGE_NAME): dist/index.html node_modules
	cd ${srcdir}
	${NPM} run package

clean:
	cd ${srcdir}
	${NPM} run clean
	rm -rf node_modules/

check: node_modules
	cd ${srcdir}
	${NPM} run lint

node_modules:
	cd ${srcdir}
	${NPM} ci

dist: dist/index.html

dist/index.html: node_modules
	cd ${srcdir}
	${NPM} run build:prod

install: dist
	${INSTALL} -d -m755 ${INSTALL_LOCATION}
	cp -R dist/* ${INSTALL_LOCATION}
