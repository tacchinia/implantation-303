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
- **bardage mélèze en lames verticales** activable par façade (nord / est / sud / ouest gauche
  jusqu'au balcon / ouest droite côté balcon, × rez / étage, plus le décrochement ouest
  face au sud ; par défaut : mélèze à l'étage sur la façade sud, l'ouest droite et le décrochement ouest), en cliquant directement sur un mur ou via la grille ; largeur de lame, pose
  jointive ou à claire-voie, vieillissement (neuf → gris argent) ; surface bardée estimée ;
- teintes d'enduit, de toiture et de menuiseries ;
- rue de la Mairie relevée sur le cadastre (chaussée jusqu'à la bordure du trottoir ouest, trottoir jusqu'à
  la limite de la parcelle de la rue), accès (arrêté au bord de la rue) et place P4 en **pavés gazon**, places P5/P6 en pavage
  continu, avec deux voitures témoins, selon deux variantes : **ouest** (actuelle, le plus à l'ouest possible
  juste à côté de la zone de visibilité de l'accès, passage piéton de 1,2 m entre P5 et P6 dans l'axe de la porte
  de l'ancienne maison, gazon entre la haie et P5) ou **est** (le long de la limite est, au sud de l'ancienne maison, accès pavé depuis les pavés gazon ;
  la verdure passe à l'ouest, traversée par une allée pavée) ; limites de parcelle, voisins
  schématiques ; muret de 30 × 15 cm en limite sud ; haie basse d'arbustes d'essences variées
  le long de la rue (sauf l'accès de 5 m), 0,60 m au plus ; **zones de visibilité** de l'accès selon le schéma de
  la loi sur les accès (case à cocher : point d'observation sur l'axe de l'accès à 3 m du bord de la chaussée,
  points visés à 20 m et à 1,5 m du bord de la voie empruntée, triangles nord et sud au sol, lignes de visibilité) ; balcon/coursive en dalle béton ; dallage continu
  le long de la façade ouest (depuis les pavés gazon, pied de l'escalier compris) jusqu'à la terrasse sud,
  qui s'arrête au droit de la grande baie ; terrasse de l'ancienne maison en hauteur (1er étage, deux
  piliers bois), masquée par défaut ; côté est et côté sud de
  l'ancienne maison pavés (jusqu'à la limite est et à l'alignement des places P5/P6,
  dessous de la terrasse compris) ; lignée d'arbres au nord de l'accès ; quelques arbres aux alentours ;
- soleil réglable (heure, mois) avec ombres portées, points de vue prédéfinis, boussole.

Paramètres d'adresse (combinables avec `&`) :

- **`?reglages`** affiche le panneau de réglages, masqué par défaut (vue en consultation seule) ;
- **`?places=est`** ou **`?places=ouest`** (défaut) choisit la variante des places P5/P6, aussi
  modifiable dans le panneau. Exemple de lien sans réglages : `maison-303-3d.html?places=est`.

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
