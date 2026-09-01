# Contribuer à CinéLog

Merci de l'intérêt porté à ce projet ! CinéLog est un projet personnel,
mais les contributions (rapports de bugs, suggestions, pull requests) sont
les bienvenues.

## Signaler un bug / proposer une fonctionnalité

Ouvre une [issue](https://github.com/BloopStudio/Cinelog/issues) en
utilisant le template correspondant. Donne un maximum de contexte : étapes
pour reproduire, comportement attendu vs observé, capture d'écran si utile.

## Proposer une modification (pull request)

1. Fork le dépôt et crée une branche depuis `main`
2. Installe les dépendances (`npm install`) et configure ton `.env` (voir
   le README)
3. Vérifie que le projet compile sans erreur TypeScript :
   ```bash
   npx tsc --noEmit
   ```
4. Ouvre une pull request en décrivant clairement le changement et sa
   motivation

## Style de code

- TypeScript strict, pas de `any` non justifié
- Composants et logique organisés sous `src/` (voir la structure dans le
  README)
- Pas de dépendance ajoutée sans raison claire
