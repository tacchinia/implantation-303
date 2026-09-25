# Implantation — Parcelle 303

Outil interactif **autonome** (un seul fichier HTML, sans dépendance ni serveur) pour
étudier l'implantation d'un nouveau bâtiment R+1 sur la parcelle 303.

👉 **[Ouvrir l'outil](implantation-parcelle-303.html)**

👉 **[Maquette 3D de la maison](maison-303-3d.html)** — visite libre du futur bâtiment et essai
du bardage mélèze façade par façade.

## Maquette 3D (`maison-303-3d.html`)

Fichier HTML autonome (three.js embarqué, fonctionne hors ligne) :

- volumes relevés sur les plans et élévations (sans cotes) et calés sur l'implantation
  ci-dessous : emprise 9,0 × 15,3 m, 3 places couvertes sous l'étage, escalier extérieur,
  coursive et terrasse à l'ouest, toit à deux pans décalés à 35 %, auvent tuilé au nord ;
- **bardage mélèze en lames verticales** activable par façade (nord / est / sud / ouest ×
  rez / étage), en cliquant directement sur un mur ou via la grille ; largeur de lame, pose
  jointive ou à claire-voie, vieillissement (neuf → gris argent) ; surface bardée estimée ;
- teintes d'enduit, de toiture et de menuiseries ;
- rue de la Mairie, accès et places en **pavés gazon**, limites de parcelle, voisins
  schématiques ; muret de 30 × 15 cm en limite sud ; petits arbustes d'essences variées
  le long de la rue (sauf l'accès de 5 m) ; balcon/coursive en dalle béton ; terrasse
  de l'ancienne maison en hauteur (1er étage, deux piliers bois) ; côté est et côté sud de
  l'ancienne maison pavés (jusqu'à la limite est et à l'alignement des places P5/P6,
  dessous de la terrasse compris) ; lignée d'arbres au nord de l'accès ; quelques arbres aux alentours ;
- soleil réglable (heure, mois) avec ombres portées, points de vue prédéfinis, boussole.

Sources dans `3d/` : `npm install && npm run build` régénère `maison-303-3d.html`.

## Ce que fait l'outil d'implantation

- Fond cadastral géoréférencé embarqué (échelle calibrée 0.0373336 m/px, plan ≈ 1:500).
- Zone constructible et bande de retrait de 3 m (limites sud / ouest / est) précalculées.
- Bâtiment déplaçable et pivotable, avec aimantation sur les angles des limites et sur
  le retrait de 3 m côté ouest.
- **Distances vivantes** aux limites, recalculées en continu et affichées en rouge
  lorsqu'elles descendent sous 3 m.
- Dimensions du bâtiment simulables (largeur / longueur).
- Terrasse, places de parking, route d'accès éditable, gabarit de braquage, outil règle,
  cotes affichables/masquables.
- Carte « Mesures et cotes » : case pour afficher ou masquer les **cotes embarquées des
  limites de la parcelle 303**, case pour afficher ou masquer d'un coup **toutes les
  mesures tracées à la règle**, et liste de ces mesures — chacune se supprime
  individuellement (croix ✕, ou sélection puis « Supprimer » / touche Suppr, comme pour
  les objets posés sur le terrain), ou toutes ensemble avec « Tout effacer ».
- Simulation d'une nouvelle limite est (variante d'acquisition de terrain).
- Export / import JSON des scénarios, et **scénarios embarqués** directement dans le
  fichier : le premier de la liste est chargé automatiquement à l'ouverture.

## Utilisation

Aucune installation : ouvrir `implantation-parcelle-303.html` dans un navigateur
(ou visiter la page publiée). Tout est embarqué dans le fichier.

⚠️ Aucune sauvegarde automatique (pas de `localStorage`) : **exporter** le scénario
avant de fermer l'onglet.

## Ajouter un scénario

1. Régler l'implantation, saisir un nom dans « Nom de la simulation », cliquer « Exporter ».
2. Ouvrir le `.json` téléchargé, copier tout son contenu.
3. Le coller dans la liste `EMBEDDED_SCENARIOS` du fichier HTML (zone balisée
   « COLLEZ VOS SCÉNARIOS ICI »), suivi d'une virgule.

Le **premier** scénario de la liste devient le scénario par défaut : il est chargé à
l'ouverture de la page et c'est celui que restaure le bouton « Réinitialiser ».

## Avertissement

Document de travail destiné aux études de variantes. **Ne remplace ni un plan de
géomètre officiel ni le règlement communal des constructions.** Les règles de distance
implémentées (3 m aux limites sud / ouest / est uniquement, empreinte déterminante) sont
des hypothèses de travail à vérifier auprès de la commune. Le nord est
supposé en haut du plan cadastral (non certifié).

Le fond de plan est un extrait cadastral ; les droits sur les données cadastrales
appartiennent à leur source (géoportail cantonal / commune).
