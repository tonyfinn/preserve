srcdir = .
prefix = /usr/local
datarootdir = ${prefix}/share
webappsdir = ${datarootdir}/webapps

NPM = npm
INSTALL = install
INSTALL_PROGRAM = ${INSTALL}
INSTALL_DATA = ${INSTALL} -m 644
INSTALL_LOCATION = ${DESTDIR}${webappsdir}/preserve

VERSION != jq -r '.version' preserve-ui/package.json
PACKAGE_WEB_PATH = ${srcdir}/target/preserve-${VERSION}.tar.gz

UI_SRC_DIR = ${srcdir}/preserve-ui
ELECTRON_SRC_DIR = ${srcdir}/preserve-electron

.PHONY: clean dist icons \
		docker podman \
		bump-major bump-minor bump-patch \
		package package-web package-electron package-electron-linux package-electron-windows \
		install

# Don't rebuild node_modules if missing unless needed,
# but also do not automatically clean it up
.INTERMEDIATE: preserve-ui/node_modules
.SECONDARY: preserve-ui/node_modules

default: package

clean:
	cd ${UI_SRC_DIR} && ${NPM} run clean
	rm -rf ${UI_SRC_DIR}/node_modules/
	rm -rf ${ELECTRON_SRC_DIR}/node_modules
	rm -rf ${srcdir}/build/
	rm -rf ${srcdir}/target/

check: preserve-ui/node_modules
	cd ${UI_SRC_DIR} && ${NPM} run lint

devserver: preserve-ui/node_modules
	cd ${UI_SRC_DIR} && ${NPM} run start


preserve-ui/node_modules:
	cd ${UI_SRC_DIR} && ${NPM} ci

dist: dist/index.html

dist/index.html: preserve-ui/node_modules
	cd ${UI_SRC_DIR} &&	${NPM} run build:prod

serve: dist
	cd ${UI_SRC_DIR} && ${NPM} run serve

install: dist
	${INSTALL} -d -m755 ${INSTALL_LOCATION}
	cp -R ${srcdir}/dist/* ${INSTALL_LOCATION}

docker: dist
	docker build -f ${srcdir}/contrib/docker/Dockerfile -t  tonyfinn/preserve:${VERSION} ${srcdir}
	docker tag tonyfinn/preserve:${VERSION} tonyfinn/preserve:latest

publish-docker: docker
	docker push tonyfinn/preserve:${VERSION}
	docker push tonyfinn/preserve:latest

podman: dist
	podman build -f ${srcdir}/contrib/docker/Dockerfile -t tonyfinn/preserve:${VERSION} ${srcdir}

build/electron/index.html: dist
	mkdir -p ${srcdir}/build/electron
	cp -R ${ELECTRON_SRC_DIR}/* ${srcdir}/build/electron
	cp -R ${srcdir}/dist/* ${srcdir}/build/electron/src
	cp -R ${UI_SRC_DIR}/static/ ${srcdir}/build/electron/src
	cd ${srcdir}/build/electron && npm ci

start-electron: build/electron/index.html
	cd ${srcdir}/build/electron && ${NPM} run start

package: package-web package-electron

package-web: $(PACKAGE_WEB_PATH)

$(PACKAGE_WEB_PATH): dist/index.html
	mkdir -p ${srcdir}/target/ 
	cd ${srcdir} && tar -czf ${PACKAGE_WEB_PATH} --transform=s/dist/preserve-${VERSION}/g dist/*

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

bump-major:
	${srcdir}/contrib/bumpver.sh major

bump-minor:
	${srcdir}/contrib/bumpver.sh minor

bump-patch:
	${srcdir}/contrib/bumpver.sh patch

icons:
	mkdir -p ${UI_SRC_DIR}/static
	for size in 16 32 48 96 128 144 192 256 ; do \
		rsvg-convert -w $$size -h $$size ${UI_SRC_DIR}/res/logo.svg --output ${UI_SRC_DIR}/static/logo-$$size.png ; \
	done
	icotool --create ${UI_SRC_DIR}/static/*.png --output=${UI_SRC_DIR}/static/favicon.ico
