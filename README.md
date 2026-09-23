# CinéLog

Application mobile de suivi de films et séries, développée avec **React Native + Expo**.
Recherche un titre via TMDB, ajoute-le à ta liste personnelle, définis son statut
(à voir / en cours / vu), note-le (étoiles, demi-notes comprises) et suis tes
saisons en cours. Tout est stocké **localement** par défaut sur l'appareil
(AsyncStorage) — pas de compte requis ; une synchronisation optionnelle entre
téléphones (Firebase) est disponible, voir plus bas.

## Stack technique

- [Expo](https://expo.dev) (SDK 57) + [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers)
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS pour React Native)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) (persistance locale)
- [TMDB API](https://developer.themoviedb.org/docs) (recherche, fiches films/séries, recommandations, watch providers)
- [Firebase](https://firebase.google.com) (Firestore + Auth anonyme, synchro optionnelle "Partager ma liste")
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) + [react-native-svg](https://github.com/software-mansion/react-native-svg) (animations : entrée/sortie des tuiles, retour au tap, anneau de progression, filtre glissant, ...)
- [@react-native-community/datetimepicker](https://github.com/react-native-datetimepicker/datetimepicker) (date de visionnage, calendrier stylé aux couleurs de l'app sur Android)
- TypeScript

## Structure du projet

```
src/
  app/                      # Écrans (Expo Router, file-based routing)
    _layout.tsx              # Layout racine (providers, stack)
    (tabs)/
      _layout.tsx             # Navigation par onglets
      index.tsx                # Ma liste (filtres, tri, genres)
      search.tsx                # Recherche TMDB (films, séries, acteurs)
      discover.tsx              # À découvrir (tendances + recommandations perso)
      journal.tsx                # Journal (titres vus, triés par date de visionnage)
      stats.tsx                  # Bilan (statistiques sur la liste)
    details/[mediaType]/[id].tsx  # Fiche détail film/série
    actor/[id].tsx              # Filmographie d'un acteur/une actrice
    share.tsx                   # Écran "Partager ma liste"
  components/                # Composants réutilisables (MovieCard, RatingStars,
                              # PosterTile, PressScale, Skeleton, RatingRing, ...)
  context/                   # WatchlistContext (état global + persistance + sync)
  services/                  # Appels API TMDB, Firebase/Firestore, AsyncStorage
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

- 🏠 Ma liste : filtrable par statut/type/genre, triable (récents, mieux notés, A-Z)
- 🔍 Recherche de films, séries et acteurs via TMDB (multi-search)
- 🎬 Fiche détail : affiche, synopsis, année, genres, durée, casting, où regarder
  (watch providers TMDB)
- ⭐ Notation sur 5 étoiles, demi-notes comprises (4.5, 3.5, ...)
- 📌 Statut (à voir / en cours / vu) et suivi de la saison en cours pour les séries
- 📅 Journal : titres vus triés par date de visionnage, éditable via un sélecteur
  de date natif (calendrier stylé aux couleurs de l'app sur Android)
- 🧭 À découvrir : tendances TMDB + une sélection personnalisée basée sur tes
  meilleures notes, qui se met à jour en direct quand un titre rejoint ta liste
- 📊 Bilan : statistiques sur ta liste (titres vus, temps estimé, note moyenne
  en anneau animé, répartition par genre)
- 🔄 Synchronisation optionnelle "Partager ma liste" entre téléphones (Firebase,
  code à 8 caractères, sans compte)
- ✨ Animations : apparition en fondu des tuiles, retour tactile sur les boutons,
  chargement en silhouettes plutôt qu'un simple spinner, chiffres qui défilent
  dans Bilan, indicateur de filtre qui glisse
- 🗑️ Suppression d'un élément de la liste
- 💾 Stockage local par défaut (AsyncStorage), aucun compte requis

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
Le workflow n'exécute **qu'un seul run à la fois** par branche (`concurrency`) :
deux publications Play Store lancées en parallèle se marchent dessus côté
Google (édition de fiche en conflit), donc les push rapprochés sont mis en
file d'attente plutôt que traités en même temps.

### Secrets GitHub à configurer

Dans *Settings → Secrets and variables → Actions* du dépôt :

| Secret | Obligatoire | Description |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | Oui | Le même token que dans `.env` (voir ci-dessus) |
| `ANDROID_KEYSTORE_BASE64` | Non* | Keystore de signature encodé en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Si keystore fourni | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | Si keystore fourni | Alias de la clé |
| `ANDROID_KEY_PASSWORD` | Si keystore fourni | Mot de passe de la clé |
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Non | Publication automatique sur le Play Store (voir section ci-dessous) |
| `FIREBASE_API_KEY` | Non | Synchro "Partager ma liste" entre téléphones (voir section ci-dessous) |
| `FIREBASE_AUTH_DOMAIN` | Non | idem |
| `FIREBASE_PROJECT_ID` | Non | idem |
| `FIREBASE_STORAGE_BUCKET` | Non | idem |
| `FIREBASE_MESSAGING_SENDER_ID` | Non | idem |
| `FIREBASE_APP_ID` | Non | idem |

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

## Publication automatique sur le Play Store

Une fois `PLAY_STORE_SERVICE_ACCOUNT_JSON` configuré, chaque build signé
(release, pas debug) est automatiquement envoyé sur la piste **Test fermé**
de la Play Console — plus besoin de télécharger/uploader l'AAB à la main.

Prérequis (une seule fois) :

1. Un compte **Google Play Console** avec l'app CinéLog créée et **au moins
   un premier envoi manuel** effectué (obligatoire pour toute nouvelle app —
   déjà fait pour CinéLog)
2. Un **compte de service Google Cloud** (*Play Console → Configuration →
   Accès API*) avec le rôle *Release manager* sur l'app, dont la clé JSON va
   dans le secret `PLAY_STORE_SERVICE_ACCOUNT_JSON`

Le workflow cible la piste `alpha` (le nom interne de "Test fermé" par
défaut) — si tu utilises une autre piste fermée, ajuste la valeur `track`
dans `.github/workflows/android-release.yml`.

Aucun compte supplémentaire n'est nécessaire pour les utilisateurs finaux.

## Synchro entre téléphones (Firebase)

CinéLog reste **100% local par défaut** (AsyncStorage, aucun compte). La
fonctionnalité optionnelle "Partager ma liste" (icône en haut à droite de
l'écran *Ma liste*) permet de synchroniser la liste entre deux téléphones via
Firestore, avec un simple code à 8 caractères (pas de compte utilisateur
classique — authentification anonyme Firebase en coulisses).

Prérequis (une seule fois) :

1. Créer un projet sur https://console.firebase.google.com (plan gratuit
   Spark, suffisant)
2. **Firestore Database** → créer la base en mode Production, puis coller le
   contenu de [`firestore.rules`](./firestore.rules) dans l'onglet *Rules*
3. **Authentication** → *Sign-in method* → activer **Anonymous**
4. **Project settings** → *Vos applications* → ajouter une app **Web** (`</>`)
   → copier les 6 valeurs de `firebaseConfig` dans les secrets `FIREBASE_*`
   ci-dessus (et dans `.env` en local, voir `.env.example`)

Ces valeurs ne sont pas secrètes à proprement parler (la sécurité vient des
règles Firestore, pas de la confidentialité de la config) ; elles sont
passées en secrets GitHub par cohérence avec le reste du projet. Sans elles,
l'app fonctionne normalement, juste sans la synchro multi-téléphones.
