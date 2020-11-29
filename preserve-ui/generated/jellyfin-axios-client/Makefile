GENERATOR_VERSION = "5.0.0-beta3"

default: openapi-generator-cli.jar
	java -jar openapi-generator-cli.jar generate \
		--input-spec jellyfin-openapi.json \
		--generator-name typescript-axios \
		--additional-properties=withSeparateModelsAndApi=true,apiPackage=api,modelPackage=model,useSingleRequestParameter=true \
		--output .

openapi-generator-cli.jar:
	wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${GENERATOR_VERSION}/openapi-generator-cli-${GENERATOR_VERSION}.jar -O openapi-generator-cli.jar
