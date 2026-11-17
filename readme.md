- Boutique

C'est une petite application web pour gérer les produits d'un magasin. On peut ajouter un produit, le modifier, le supprimer et en chercher un. Tout est enregistré dans une base de données PostgreSQL.

On a fait ce projet pour le cours d'initiation à Docker à l'IIM. Le but : lancer toute l'application avec une seule commande. Docker Compose démarre 3 choses : l'application, la base de données et Adminer (un outil pour voir la base dans le navigateur).

- Ce qu'il faut installer

Juste Docker Desktop. On n'a pas besoin d'installer Node ni PostgreSQL sur son ordinateur.

- Comment lancer le projet

1. Récupérer le projet avec `git clone https://github.com/Touko74/initiation_docker.git`, puis aller dans le dossier avec `cd initiation_docker`.
2. Créer le fichier `.env` en copiant l'exemple avec `cp .env.example .env`. Sous PowerShell, si `cp` ne marche pas : `copy .env.example .env`.
3. Ouvrir le fichier `.env` et écrire une valeur après chaque `=`. Ce sont les identifiants de la base, on les choisit nous-mêmes : `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`.
4. Lancer le tout avec `docker compose up -d --build`.

Au premier lancement, la base peut mettre quelques secondes à démarrer.

- Les deux adresses à ouvrir

- L'application : http://localhost:3000
- Adminer : http://localhost:8080

Quand le bandeau en haut de l'application affiche « Base : connectée » en vert, c'est que tout marche.

- Se connecter à Adminer

Sur http://localhost:8080, on remplit le formulaire comme ça :

- Système : PostgreSQL
- Serveur : `db`
- Utilisateur : la valeur de `POSTGRES_USER` dans le `.env`
- Mot de passe : la valeur de `POSTGRES_PASSWORD`
- Base de données : la valeur de `POSTGRES_DB`

Après la connexion, on voit la table `produits` dans la liste.

- Arrêter le projet

Pour arrêter, on fait `docker compose down`. Les données ne sont pas perdues : elles sont gardées dans un volume Docker qui s'appelle `produit`. Quand on relance le projet, les produits ajoutés sont toujours là.

Pour tout effacer et repartir avec une base vide, on fait `docker compose down -v`.

- Les fichiers du projet

- `app/` : le code de l'application, avec son Dockerfile et son .dockerignore
- `compose.yaml` : décrit les 3 services et le volume
- `.env.example` : la liste des variables à remplir

Notre vrai `.env` n'est pas sur GitHub, parce qu'il contient le mot de passe.

- Auteurs

TOUKO SANAMA César et CHEDDAD Sami