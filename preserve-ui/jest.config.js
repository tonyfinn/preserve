module.exports = {
    "name": "preserve-ui",
    "moduleFileExtensions": [
        "js",
        "json",
        "ts",
        "vue"
    ],
    "transform": {
        ".*\\.(vue)$": "vue-jest",
        "^.+\\.tsx?$": "ts-jest"
    },
    "moduleNameMapper": {
        'jellyfin-axios-client': path.resolve(
            __dirname,
            'generated',
            'jellyfin-axios-client'
        ),
        'preserve-ui': path.resolve(__dirname),
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
}
