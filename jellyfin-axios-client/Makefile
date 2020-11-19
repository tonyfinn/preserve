GENERATOR_VERSION = "5.0.0-beta"

default: openapi-generator-cli.jar
	java -jar openapi-generator-cli.jar generate \
		--input-spec jellyfin-openapi.json \
		--generator-name typescript-axios \
		--additional-properties=npmName=jellyfin-axios-client,npmVersion=1.0.0 \
		--output src

openapi-generator-cli.jar:
	wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${GENERATOR_VERSION}/openapi-generator-cli-${GENERATOR_VERSION}.jar -O openapi-generator-cli.jar
