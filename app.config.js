// Config dynamique (au lieu d'app.json) pour pouvoir calculer la version
// à partir du nombre de commits git au moment du build CI.
// En local, ANDROID_VERSION_CODE n'est pas défini : on retombe sur 1.
const androidVersionCode = Number(process.env.ANDROID_VERSION_CODE) || 1;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "CinéLog",
    slug: "cinelog",
    version: String(androidVersionCode),
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cinelog",
    userInterfaceStyle: "dark",
    backgroundColor: "#0B0F14",
    ios: {
      bundleIdentifier: "com.bloopstudio.cinelog",
      icon: "./assets/images/icon.png",
      supportsTablet: true,
    },
    android: {
      package: "com.bloopstudio.cinelog",
      versionCode: androidVersionCode,
      adaptiveIcon: {
        backgroundColor: "#0B0F14",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#0B0F14",
          image: "./assets/images/splash-icon.png",
          imageWidth: 120,
        },
      ],
      [
        "@react-native-community/datetimepicker",
        {
          // Sans ça, le sélecteur de date Android garde le thème clair par
          // défaut d'Android (fond blanc, accents bleus) au lieu de reprendre
          // les couleurs de l'app — d'où l'effet "pas beau"/hors charte.
          android: {
            datePicker: {
              colorAccent: { light: "#E63946" },
              colorControlActivated: { light: "#E63946" },
              colorControlHighlight: { light: "#33E63946" },
              textColor: { light: "#F5F7FA" },
              textColorPrimary: { light: "#F5F7FA" },
              textColorSecondary: { light: "#9AA5B1" },
              windowBackground: { light: "#151B23" },
            },
          },
        },
      ],
      "./plugins/withAndroidReleaseSigning.js",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
