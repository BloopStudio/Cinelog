const { withAppBuildGradle } = require("@expo/config-plugins");

// Injecte une configuration de signature "release" dans android/app/build.gradle,
// lue depuis des variables d'environnement au moment du build (voir le workflow
// .github/workflows/android-release.yml). Permet de générer un APK release signé
// sans committer ni le keystore ni le dossier android/ (généré par `expo prebuild`).
const SIGNING_CONFIG_MARKER = "// @cinelog-release-signing";

function injectSigningConfig(buildGradle) {
  if (buildGradle.includes(SIGNING_CONFIG_MARKER)) {
    return buildGradle;
  }

  const signingConfigBlock = `
    signingConfigs {
        release {
            ${SIGNING_CONFIG_MARKER}
            def keystorePath = System.getenv("ANDROID_RELEASE_KEYSTORE_PATH")
            if (keystorePath) {
                storeFile file(keystorePath)
                storePassword System.getenv("ANDROID_RELEASE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_RELEASE_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_RELEASE_KEY_PASSWORD")
            }
        }
    }
`;

  let updated = buildGradle.replace(
    /signingConfigs\s*\{/,
    `${signingConfigBlock}\n    signingConfigs {`
  );

  if (updated === buildGradle) {
    updated = buildGradle.replace(
      /android\s*\{/,
      `android {\n${signingConfigBlock}`
    );
  }

  updated = updated.replace(
    /(release\s*\{[^}]*?)(signingConfig\s+signingConfigs\.debug)/s,
    (match, prefix) => {
      return `${prefix}signingConfig System.getenv("ANDROID_RELEASE_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug`;
    }
  );

  return updated;
}

const withAndroidReleaseSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withAndroidReleaseSigning: seul build.gradle en Groovy est supporté");
    }
    config.modResults.contents = injectSigningConfig(config.modResults.contents);
    return config;
  });
};

module.exports = withAndroidReleaseSigning;
