# 🏃 RunPace — Programme Running 10 km

Application mobile PWA pour gérer votre programme d'entraînement running orienté 10 km, avec cycles progressifs et stockage 100% local.

---

## ✨ Fonctionnalités

- **4 cycles d'entraînement** (Construction → Développement → Spécifique Performance) avec toutes les séances
- **Génération automatique** de nouveaux cycles avec progression intelligente
- **Validation des séances** : ✅ Réalisée / ❌ Non faite / 🔄 Déplacée
- **Édition manuelle** de chaque séance (contenu, allure, récupération, notes)
- **Tableau de bord** avec graphiques de progression et statistiques
- **Paramètres sportifs** (allure 10km, VMA, objectifs)
- **Export/Import JSON** pour sauvegarder vos données
- **PWA installable** sur Android et iPhone
- **100% offline** — aucune donnée envoyée sur internet

---

## 🚀 Déploiement sur GitHub Pages

### 1. Créer le dépôt

```bash
git init
git add .
git commit -m "Initial commit — RunPace"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/running-app.git
git push -u origin main
```

### 2. Activer GitHub Pages

1. Aller dans **Settings → Pages**
2. Source : **GitHub Actions**
3. Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement

### 3. Accéder à l'app

Votre app sera disponible à :
```
https://VOTRE_USERNAME.github.io/running-app/
```

> ⚠️ Si le déploiement échoue avec des assets 404, vérifiez que `base: './'` est bien dans `vite.config.js`.

---

## 💻 Développement local

```bash
# Installer les dépendances
npm install

# Générer les icônes SVG (optionnel)
node generate-icons.mjs

# Lancer en développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 📱 Installer comme PWA

### Sur iPhone (Safari)
1. Ouvrir l'URL dans Safari
2. Appuyer sur **Partager** → **Sur l'écran d'accueil**

### Sur Android (Chrome)
1. Ouvrir l'URL dans Chrome
2. Menu **⋮** → **Ajouter à l'écran d'accueil**

---

## 🔧 Icônes PWA

Les icônes PNG sont requises pour une PWA fonctionnelle.

**Option rapide** — Générer et convertir :
```bash
node generate-icons.mjs
# Puis convertir public/icons/*.svg en .png via https://svgtopng.com
```

**Option npm** :
```bash
npm install -g sharp-cli
npx sharp -i public/icons/icon-192.svg -o public/icons/icon-192.png
npx sharp -i public/icons/icon-512.svg -o public/icons/icon-512.png
```

---

## 🏗️ Architecture

```
src/
├── data/
│   └── trainingData.js      # Données des 3 cycles complets + types/statuts
├── utils/
│   ├── storage.js           # Helpers localStorage
│   └── progression.js       # Algorithme de génération de cycle
├── hooks/
│   └── useTraining.js       # Hook principal — état global + actions
├── components/
│   ├── BottomNav.jsx        # Navigation bas de page
│   ├── CycleWeekNav.jsx     # Navigation cycles/semaines
│   ├── SessionCard.jsx      # Carte de séance
│   └── SessionEditor.jsx    # Modal d'édition
└── views/
    ├── ProgramView.jsx      # Vue programme principal
    ├── TodayView.jsx        # Vue aujourd'hui
    ├── ProgressView.jsx     # Tableau de bord + graphiques
    └── SettingsView.jsx     # Paramètres
```

---

## 📊 Programme intégré

| Cycle | Phase | Semaines |
|-------|-------|----------|
| Cycle 1 | Construction | 4 semaines (S4 allégée) |
| Cycle 2 | Développement | 4 semaines (S4 allégée) |
| Cycle 3 | Spécifique Performance | 4 semaines (S4 allégée) |
| Cycle 4+ | Auto-généré | Progression automatique |

### Règles de progression automatique

**Lundi (VMA)** : Réduire récupération → Ajouter répétitions → Allonger les fractions

**Jeudi (Spécifique)** : 5×4 → 6×4 → 5×5 → 4×6 → 3×10 → 3×12 → 2×15 min

---

## 🛠️ Stack technique

- **React 18** + **Vite 5**
- **Tailwind CSS 3** avec thème custom dark
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes
- **vite-plugin-pwa** + Workbox pour le service worker
- **localStorage** pour la persistance locale

---

## 📝 Licence

MIT — Usage personnel libre.
