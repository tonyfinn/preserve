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

.PHONY: clean dist icons \
		docker podman \
		package package-web package-electron package-electron-linux package-electron-windows \
		install

default: package

clean:
	cd ${srcdir} && ${NPM} run clean
	rm -rf ${srcdir}/node_modules/
	rm -rf ${srcdir}/preserve-electron/node_modules
	rm -rf ${srcdir}/build/

check: node_modules
	cd ${srcdir} && ${NPM} run lint

node_modules:
	cd ${srcdir} && ${NPM} ci

dist: dist/index.html

dist/index.html: node_modules
	cd ${srcdir} &&	${NPM} run build:prod

install: dist
	${INSTALL} -d -m755 ${INSTALL_LOCATION}
	cp -R ${srcdir}/dist/* ${INSTALL_LOCATION}

docker: dist
	docker build -f ${srcdir}contrib/docker/Dockerfile -t  tonyfinn/preserve:${VERSION} ${srcdir}
	docker tag tonyfinn/preserve:${VERSION} tonyfinn/preserve:latest

publish-docker: docker
	docker push tonyfinn/preserve:${VERSION}
	docker push tonyfinn/preserve:latest

podman: dist
	podman build -f ${srcdir}/contrib/docker/Dockerfile -t tonyfinn/preserve:${VERSION} .

build/electron/index.html: dist
	mkdir -p ${srcdir}/build/electron
	cp -R ${srcdir}/preserve-electron/* ${srcdir}/build/electron
	cp -R ${srcdir}/dist/* ${srcdir}/build/electron/src
	cp -R ${srcdir}/static/ ${srcdir}/build/electron/src
	cd ${srcdir}/build/electron && npm ci

start-electron: build/electron/index.html
	cd ${srcdir}/build/electron && ${NPM} run start

package: package-web package-electron

package-web: $(PACKAGE_NAME)

$(PACKAGE_NAME): dist/index.html node_modules
	cd ${srcdir} && ${NPM} run package

package-electron: package-electron-linux package-electron-windows

package-electron-linux: build/electron/index.html
	mkdir -p ${srcdir}/target/
	cd ${srcdir}/build/electron && ${NPM} run make
	cp ${srcdir}/build/electron/out/make/deb/x64/* ${srcdir}/target/
	cp ${srcdir}/build/electron/out/make/rpm/x64/* ${srcdir}/target/

package-electron-windows: build/electron/index.html
	mkdir -p ${srcdir}/target/
	cd ${srcdir}/build/electron && ${NPM} run make -- --platform win32 --targets @electron-forge/maker-squirrel
	cp ${srcdir}/build/electron/out/make/squirrel.windows/x64/*.exe ${srcdir}/target/

icons:
	mkdir -p ${srcdir}/static
	for size in 16 32 48 96 128 144 192 256 ; do \
		rsvg-convert -w $$size -h $$size ${srcdir}/res/logo.svg --output ${srcdir}/static/logo-$$size.png ; \
	done
	icotool --create ${srcdir}/static/*.png --output=${srcdir}/static/favicon.ico
