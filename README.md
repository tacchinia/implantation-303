# Implantation — Parcelle 303

Outil interactif **autonome** (un seul fichier HTML, sans dépendance ni serveur) pour
étudier l'implantation d'un nouveau bâtiment R+1 sur la parcelle 303.

👉 **[Ouvrir l'outil](implantation-parcelle-303.html)**

👉 **[Maquette 3D de la maison](maison-303-3d.html)** — visite libre du futur bâtiment et essai
du bardage mélèze façade par façade.

## Maquette 3D (`maison-303-3d.html`)

Fichier HTML autonome (three.js embarqué, fonctionne hors ligne) :

- volumes relevés sur les plans et élévations (sans cotes) et calés sur l'implantation
  ci-dessous selon le **plan d'implantation v2** (plan n° 166/7) : emprise 9,0 × 15,3 m, orientation 3,6°,
  3 places couvertes P1–P3 sous l'étage, escalier extérieur,
  coursive et terrasse à l'ouest, toit à deux pans décalés à 35 %, auvent tuilé au nord ;
- **bardage mélèze en lames verticales** activable par façade (nord / est / sud / ouest gauche
  jusqu'au balcon / ouest droite côté balcon, × rez / étage, plus le décrochement ouest
  face au sud ; par défaut : mélèze à l'étage sur la façade sud, l'ouest droite et le décrochement ouest), en cliquant directement sur un mur ou via la grille ; largeur de lame, pose
  jointive ou à claire-voie, vieillissement (neuf → gris argent) ; surface bardée estimée ;
- teintes d'enduit, de toiture et de menuiseries ;
- rue de la Mairie relevée sur le cadastre (chaussée jusqu'à la bordure du trottoir ouest, trottoir jusqu'à
  la limite de la parcelle de la rue), accès en **pavés gazon** du bord de la rue jusqu'à la limite est ;
  **P4 à l'est du bâtiment**, à la suite de P1–P3 (même front nord, pavés béton sous la voiture jusqu'à la
  limite est, pavés gazon sur l'accès) ; **allée piétonne en dalles pleines** de la rue à la façade ouest,
  au sud de l'accès ; places P5/P6 avec voitures témoins selon deux variantes : **est** (référence, par
  défaut : le long de la limite est, au sud de l'ancienne maison ; verdure à l'ouest de P5 jusqu'à la haie)
  ou **ouest** (le plus à l'ouest possible, à côté de la zone de visibilité de l'accès) ; limites de parcelle,
  voisins schématiques ; muret de 30 × 15 cm en limite sud ; haie basse d'arbustes d'essences variées
  le long de la rue (sauf l'accès et l'allée piétonne), 0,60 m au plus ; **zones de visibilité** de l'accès
  (case à cocher) ; balcon/coursive en dalle béton ; dallage le long de la façade ouest jusqu'à la terrasse
  sud ; terrasse de l'ancienne maison en hauteur, masquée par défaut ; abords pavés de l'ancienne maison ;
  quelques arbres aux alentours ;
- soleil réglable (heure, mois) avec ombres portées, points de vue prédéfinis, boussole.

Paramètres d'adresse (combinables avec `&`) :

- **`?implantation=actuelle`** revient à l'ancienne implantation ; par défaut, implantation du **plan
  d'implantation v2** (3,65 m de la limite et 8,00 m de l'axe de la rue, 3,00 m au sud). Sélecteur
  « Implantation » dans le panneau ;
- **`?servitude`** affiche la servitude de distance chez les voisins 999 et 292 (bande orange au sol,
  masquée par défaut ; aussi case « Servitude » du panneau) ;
- **`?reglages`** affiche le panneau de réglages, masqué par défaut (vue en consultation seule) ;
- **`?places=est`** (défaut) ou **`?places=ouest`** choisit la variante des places P5/P6, aussi
  modifiable dans le panneau. Exemple : `maison-303-3d.html?places=ouest&servitude`.

Sources dans `3d/` : `npm install && npm run build` régénère `maison-303-3d.html`.

## Ce que fait l'outil d'implantation

- Fond cadastral géoréférencé embarqué (échelle calibrée 0.0373336 m/px, plan ≈ 1:500).
- Zone constructible et bande de retrait de 3 m (limites sud / ouest / est) précalculées.
- Bâtiment déplaçable et pivotable, avec aimantation sur les angles des limites, sur
  le retrait de 3 m côté ouest et sur le retrait de 8 m à l'axe de la rue.
- **Plan d'implantation v2 (référence)** : position par défaut du bâtiment relevée sur le plan
  n° 166/7 (rot. 3,6°, 3,65 m de la limite côté rue, 8,00 m de l'axe, 3,00 m au sud, 2,44 m à l'est) ;
  case « Implantation de référence » (décochée ou `?implantation=actuelle` : ancienne position).
  L'axe de la rue est celui du plan. Cotes du plan côté rue (3,65 m + 4,40 m à l'axe) chargées
  comme mesures. **Servitude** selon le plan : limite virtuelle en ligne brisée jusqu'au point de la
  mitoyenne 999/292 situé à 3 m du bâtiment, 10,3 m² (999) + 3,0 m² (292) (plan : 10,40 + 3,20).
  Scénario par défaut : P4 à l'est du bâtiment (à la suite des places couvertes), P5/P6 à l'est,
  accès jusqu'à la limite est, allée piétonne, gabarit de braquage masqué.
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
