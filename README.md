# 🌿 Mon Journal des Plantes

Application Android pour suivre vos plantes : journal photo, conseils d'entretien et rappels d'arrosage.

---

## Fonctionnalités

- **Journal photo** — photographiez vos plantes, chaque photo est datée et classée en timeline pour suivre leur évolution
- **Fiches espèces** — 18 espèces en base (Monstera, Pothos, Orchidée, Aloe Vera, Cactus...) avec conseils arrosage, lumière, température, fertilisation
- **Rappels d'arrosage** — définissez une fréquence par plante et recevez une notification à l'heure choisie
- **Tableau de bord arrosage** — toutes vos plantes triées par urgence (rouge = en retard, orange = aujourd'hui, vert = OK)

---

## Générer l'APK Android

### Prérequis

- [Node.js](https://nodejs.org/) 18 ou supérieur
- Un compte **Expo** gratuit sur [expo.dev](https://expo.dev)

### 1. Cloner le projet et installer les dépendances

```bash
git clone https://github.com/mokrasgpt-ux/plantes.git
cd plantes
git checkout claude/plant-journal-android-app-nMcwa
npm install
```

### 2. Installer EAS CLI

```bash
npm install -g eas-cli
```

### 3. Se connecter à Expo

```bash
eas login
```

Entrez votre email et mot de passe Expo. Si vous n'avez pas de compte, créez-en un gratuitement sur [expo.dev](https://expo.dev).

### 4. Initialiser le projet EAS

```bash
eas init
```

Cette commande lie le projet à votre compte Expo et génère un `projectId` dans `app.json`. Répondez **Y** si on vous demande de créer un nouveau projet.

### 5. Lancer le build APK

```bash
eas build --platform android --profile preview
```

Le build se fait **dans le cloud** (serveurs Expo), pas sur votre machine. Comptez environ **10-15 minutes**.

À la fin, EAS vous donne un **lien de téléchargement direct** pour l'APK.

### 6. Installer l'APK sur votre téléphone

1. Téléchargez l'APK depuis le lien fourni
2. Sur votre Android : **Paramètres → Sécurité → Autoriser les sources inconnues** (ou "Installer des applis inconnues" selon la version Android)
3. Ouvrez le fichier `.apk` téléchargé et installez

> **Astuce** : Vous pouvez aussi scanner le QR code affiché par EAS directement depuis votre téléphone.

---

## Développement local

Pour tester l'app sans build APK, installez [Expo Go](https://expo.dev/go) sur votre téléphone puis :

```bash
npm start
```

Scannez le QR code avec l'app Expo Go.

---

## Stack technique

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) ~54
- [React Navigation](https://reactnavigation.org/) (stack + tabs)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) pour la persistance locale
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) pour les rappels
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) pour les photos
- TypeScript
