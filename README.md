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

## Publication (à venir)

Un workflow GitHub Actions pour la publication automatique sur le Google Play
Store (build EAS + upload via `eas submit`) sera ajouté dans une prochaine
étape.
