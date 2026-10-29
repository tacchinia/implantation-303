// Données du site, reprises de l'outil d'implantation (implantation-parcelle-303.html,
// const GEO et scénario embarqué « 6 places avec route »). Mètres, repère du plan
// cadastral : x vers l'est, y vers le sud (nord en haut du plan).
export const GEO = {
  parcel303: [[11.461, 4.674], [23.042, 5.272], [27.884, 5.227], [25.951, 22.143], [25.01, 22.299], [23.281, 36.161], [23.367, 47.033], [7.172, 50.897], [8.643, 28.556], [9.681, 19.544]],
  boundaries: {
    east: [[27.884, 5.227], [25.951, 22.143], [25.01, 22.299], [23.281, 36.161], [23.367, 47.033]],
    south: [[23.367, 47.033], [7.172, 50.897]],
    west: [[7.172, 50.897], [8.643, 28.556], [9.681, 19.544], [11.461, 4.674]],
  },
  house169: [[11.461, 4.723], [22.852, 5.309], [22.594, 16.531], [19.761, 16.475], [19.712, 17.543], [15.251, 17.442], [15.251, 16.386], [10.756, 16.177], [11.163, 7.784], [11.641, 7.784]],
  house165: [[34.254, 9.808], [43.139, 9.692], [43.139, 16.968], [47.996, 16.968], [48.116, 30.102], [39.219, 30.218], [39.219, 27.198], [34.254, 27.198]],
  tl_bldg: [[12.768, 0.0], [23.039, 0.0], [22.945, 1.419], [26.925, 1.747], [27.138, 5.171], [23.106, 5.212], [12.537, 4.667]],
  road_e: [[11.909, 0.0], [11.461, 4.674], [9.681, 19.544], [8.643, 28.556], [7.172, 50.897], [8.176, 55.179]],
  road_w: [[3.192, 0.0], [0.0, 24.454], [1.717, 28.374], [1.344, 34.347], [1.195, 37.334], [1.083, 40.32], [0.971, 43.307], [0.971, 46.294], [1.12, 49.28], [1.269, 52.267], [1.493, 55.179]],
};

export const SCENARIO = {
  building: { x: 11.755, y: 28.921, rot: 4.25, w: 9.0, len: 15.3 },
  // route d'accès en pavés gazon (largeur 5 m) ; premier point prolongé jusqu'à la rue
  route: { pts: [[8.4, 26.15], [10.48, 26.26], [13.18, 26.41], [16.71, 26.67], [19.63, 26.92], [23.45, 27.29], [22.92, 33.38]], width: 5 },
  parkings: [
    { x: 22.12, y: 32.24, rot: 364.5, w: 2.7, h: 5, label: 'P4' },
  ],
  // P5/P6 : deux implantations au choix (sélecteur « Places P5/P6 » ou ?places=ouest|est)
  p56: {
    // ouest (actuelle) : places hors de la zone de visibilité de l'accès (marge ≥ 0,5 m au triangle
    // nord O–F–I), passage piéton de 1,2 m entre P5 et P6 dans l'axe de la porte de la maison 169,
    // extrémité sud au bord nord de l'accès. Pavage continu limité aux places et au passage : à l'ouest
    // de P5, gazon jusqu'à la haie basse ; au sud, un bord droit qui passe sur les pavés gazon.
    ouest: {
      name: 'Ouest (actuelle)',
      places: [
        { x: 12.94, y: 21.389, rot: 3, w: 2.7, h: 5, label: 'P5' },
        { x: 16.84, y: 21.667, rot: 3, w: 2.7, h: 5, label: 'P6' },
      ],
      paved: [[[11.723, 18.822], [18.319, 19.24], [18.043, 24.503], [11.448, 24.07]]],
    },
    // est (variante, visibilité depuis la rue) : places au sud-est de la maison 169, le long de la
    // limite est, accès pavé depuis les pavés gazon ; la verdure passe à l'ouest, traversée par une
    // allée pavée de 1,2 m le long de la bande verte (abords pavés de la maison 169 inchangés).
    est: {
      name: 'Est (variante)',
      places: [
        { x: 21.6, y: 19.4, rot: 3, w: 2.7, h: 5, label: 'P5' },
        { x: 24.45, y: 19.5, rot: 3, w: 2.7, h: 5, label: 'P6' },
      ],
      paved: [
        [[20.383, 16.833], [25.929, 17.074], [25.667, 22.067], [24.98, 22.32], [24.62, 25.2], [19.85, 24.72], [20.121, 21.826]],
        [[11.276, 18.807], [12.477, 18.869], [11.886, 24.0], [10.678, 24.0]],
      ],
    },
  },
  terrace169: { x: 21.27, y: 18.03, rot: 2, w: 3, h: 3 },
  // visibilité de l'accès sur la rue de la Mairie : point d'observation O sur l'axe de l'allée en pavés
  // gazon, à 3 m du bord de la rue ; F = pied de la perpendiculaire sur le bord de la rue ; lignes de
  // visibilité vers des points de la chaussée à la même distance de l'accès (nord et sud), qui coupent le
  // bord de la rue en I (nord) et S (sud). Triangles O–F–I et O–F–S à garder libres (rien > 0,60 m).
  visibility: {
    triangles: [[[11.918, 26.34], [8.938, 25.997], [9.578, 20.44]], [[11.918, 26.34], [8.938, 25.997], [7.922, 39.511]]],
    lines: [[[11.918, 26.34], [3.904, 6.136]], [[11.918, 26.34], [6.001, 45.841]]],
  },
};
