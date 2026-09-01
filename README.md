# CinéLog

Application mobile de suivi de films et séries, développée avec **React Native + Expo**.
Recherche un titre via TMDB, ajoute-le à ta liste personnelle, définis son statut
(à voir / en cours / vu) et note-le sur 5. Tout est stocké **localement** sur
l'appareil (AsyncStorage) — pas de compte, pas de backend.

## Stack technique

- [Expo](https://expo.dev) (SDK 57) + [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers)
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS pour React Native)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) (persistance locale)
- [TMDB API](https://developer.themoviedb.org/docs) (recherche et fiches films/séries)
- TypeScript

## Structure du projet

```
src/
  app/                      # Écrans (Expo Router, file-based routing)
    _layout.tsx              # Layout racine (providers, stack)
    (tabs)/
      _layout.tsx             # Navigation par onglets
      index.tsx                # Écran d'accueil : ma liste
      search.tsx                # Écran de recherche TMDB
    details/[mediaType]/[id].tsx  # Fiche détail film/série
  components/                # Composants réutilisables (MovieCard, RatingStars, ...)
  context/                   # WatchlistContext (état global + persistance)
  services/                  # Appels API TMDB + accès AsyncStorage
  constants/                 # Constantes (statuts, thème)
  types/                     # Types TypeScript partagés
```

## Démarrage

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un fichier `.env` à la racine à partir de `.env.example` et renseigner
   ta clé TMDB :

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_TMDB_ACCESS_TOKEN=ton_token_v4_tmdb
   ```

   Le token (API Read Access Token, auth v4) se récupère gratuitement sur
   [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

3. Lancer l'application (Android en priorité) :

   ```bash
   npx expo start
   ```

   Puis appuyer sur `a` pour ouvrir sur un émulateur/appareil Android, ou
   scanner le QR code avec l'app **Expo Go**.

## Fonctionnalités

- 🏠 Accueil listant la watchlist personnelle, filtrable par statut
- 🔍 Recherche de films et séries via TMDB (multi-search)
- 🎬 Fiche détail : affiche, synopsis, année, genres, durée/saisons
- ⭐ Notation sur 5 étoiles
- 📌 Ajout / mise à jour du statut (à voir, en cours, vu)
- 🗑️ Suppression d'un élément de la liste
- 💾 Stockage 100% local (AsyncStorage), aucun compte requis

## Note sur la clé TMDB

La clé TMDB (`EXPO_PUBLIC_TMDB_ACCESS_TOKEN`) est **la clé du développeur**,
intégrée dans l'application au moment du build. Une personne qui installe
CinéLog depuis le Play Store n'a rien à créer sur TMDB (ni sur aucun autre
site) : elle télécharge l'app et elle fonctionne directement, comme n'importe
quelle app qui appelle une API en coulisses.

## Build automatique d'un APK (GitHub Actions)

Le workflow [`.github/workflows/android-release.yml`](.github/workflows/android-release.yml)
build un **APK release** de CinéLog :

- à chaque push sur `main` → artefact téléchargeable dans l'onglet *Actions*
  du dépôt (`cinelog-release-apk`)
- à chaque tag `v*` (ex. `v1.0.0`) → en plus, publie une **GitHub Release**
  avec l'APK joint
- manuellement, via *Run workflow*

Le build est **100% local** (Gradle sur le runner GitHub, via `expo prebuild`)
et ne nécessite **aucun compte Expo/EAS**. Le `versionCode` Android est calculé
automatiquement à partir du nombre de commits (`git rev-list --count HEAD`).

### Secrets GitHub à configurer

Dans *Settings → Secrets and variables → Actions* du dépôt :

| Secret | Obligatoire | Description |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | Oui | Le même token que dans `.env` (voir ci-dessus) |
| `ANDROID_KEYSTORE_BASE64` | Non* | Keystore de signature encodé en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Si keystore fourni | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | Si keystore fourni | Alias de la clé |
| `ANDROID_KEY_PASSWORD` | Si keystore fourni | Mot de passe de la clé |

\* Sans keystore, l'APK release est signé avec la clé de debug par défaut :
il s'installe et fonctionne pour tester, mais **n'est pas valable pour une
publication sur le Play Store**. Pour générer un vrai keystore (à faire une
seule fois, à conserver précieusement — il doit rester le même à chaque
publication) :

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore cinelog-release.keystore \
  -alias cinelog -keyalg RSA -keysize 2048 -validity 10000

base64 -w0 cinelog-release.keystore > cinelog-release.keystore.base64
```

Colle le contenu de `cinelog-release.keystore.base64` dans le secret
`ANDROID_KEYSTORE_BASE64`, puis renseigne les mots de passe/alias choisis
lors de la génération dans les autres secrets.

## Publication sur le Play Store (à venir)

La prochaine étape ajoutera l'upload automatique du build (AAB) sur le
Google Play Store via l'API Google Play Developer, ce qui nécessitera :

- un compte **Google Play Console** (compte développeur, avec l'app créée et
  au moins un premier envoi manuel, obligatoire pour toute nouvelle app)
- un **compte de service Google Cloud** avec accès à l'API Play Console, dont
  la clé JSON sera stockée en secret GitHub

Aucun compte supplémentaire ne sera nécessaire pour les utilisateurs finaux.
