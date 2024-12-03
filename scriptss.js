        // 1. Initialisation de la carte
        const map = L.map('map').setView([31, -8.5], 8.5); // Coordonnées centrées sur la province d'El Haouz
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }).addTo(map);

        let geojsonData; // Pour stocker les données GeoJSON
        let geojsonLayer;
        let communesOptions = []; // Tableau pour stocker les options des communes

        // Afficher l'épicentre au chargement de la page
fetch('epicentre.geojson')  // Remplacez par le chemin réel de votre fichier GeoJSON d'épicentre
    .then(response => response.json())
    .then(data => {
        addEpicentreToMap(data); // Ajouter l'épicentre
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier GeoJSON de l'épicentre : ", error);
    });

        // 2. Chargement des données GeoJSON
        
fetch('communes.geojson') // Remplacez par le chemin réel de votre fichier GeoJSON
    .then(response => response.json())
    .then(data => {
        geojsonData = data;
        populateCommuneSelect(data); // Remplir le sélecteur des communes
        displayGeojson(data); // Affiche les données initiales sur la carte
    });

    let hospitalData; // Pour stocker les données des hôpitaux
let hospitalLayer; // Pour gérer la couche des hôpitaux

// 1. Chargement des données des hôpitaux
fetch('hopitaux.geojson')  // Remplacez par le chemin réel de votre fichier GeoJSON d'hôpitaux
    .then(response => response.json())
    .then(data => {
        hospitalData = data;
        populateHospitalSelect(data); // Remplir le sélecteur des hôpitaux
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier GeoJSON des hôpitaux : ", error);
    });
    
    let damagedBuildingsLayer; // Pour la couche des bâtiments touchés
let undamagedBuildingsLayer; // Pour la couche des bâtiments non touchés

// Charger les fichiers GeoJSON
fetch('damagedbuilding.geojson')
    .then(response => response.json())
    .then(data => {
        // Créer la couche pour les bâtiments touchés
        damagedBuildingsLayer = L.geoJSON(data, {
            style: {
                color: 'red', // Rouge pour les bâtiments touchés
                fillOpacity: 1
            },
            onEachFeature: function (feature, layer) {
    layer.bindPopup(`
        <strong>Surface en (m²)</strong> : ${feature.properties.area_in_me}<br>
        <strong>Etat</strong> : ${feature.properties.etat}<br>
        <strong>Commune</strong> : ${feature.properties.nom_commune}<br>
        <strong>Distance de l'épicentre (en km)</strong> : ${feature.properties.dis_epicentre_km}<br>
        <strong>Hôpital le plus proche</strong> : ${feature.properties.nearest_hosp}<br>
        <strong>Distance de l'hôpital le plus proche (en km)</strong> : ${feature.properties.distance_nearest_hosp_km}
    `);
}

        });
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier 'damagedbuilding.geojson' :", error);
    });

fetch('undamagedbuilding.geojson')
    .then(response => response.json())
    .then(data => {
        // Créer la couche pour les bâtiments non touchés
        undamagedBuildingsLayer = L.geoJSON(data, {
            style: {
                color: 'green', // Vert pour les bâtiments non touchés
                fillOpacity: 1
            },
            onEachFeature: function (feature, layer) {
    layer.bindPopup(`
        <strong>Surface en (m²)</strong> : ${feature.properties.area_in_me}<br>
        <strong>Etat</strong> : ${feature.properties.etat}<br>
        <strong>Commune</strong> : ${feature.properties.nom_commun}<br>
        
    `);
}

        });
    })
    .catch(error => {
        console.error("Erreur lors du chargement du fichier 'undamagedbuilding.geojson' :", error);
    });

// 2. Fonction pour remplir le sélecteur des hôpitaux
function populateHospitalSelect(data) {
    const hospitalSelect = document.getElementById('hospitalSelect');
    // Supprimer les options existantes (y compris "Sélectionner un hôpital")
    hospitalSelect.innerHTML = '';

    

    

    // Ajouter les options des hôpitaux dynamiquement
    data.features.forEach(feature => {
        const hospitalName = feature.properties.nom; // Assurez-vous que 'nom' est la bonne propriété
        const option = document.createElement('option');
        option.value = hospitalName;
        option.textContent = hospitalName;
        hospitalSelect.appendChild(option);
    });

    // Ajouter une option "Tous" pour afficher tous les hôpitaux
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Tous les hôpitaux';
    hospitalSelect.appendChild(allOption);

    // Ajouter une option "Désactiver tous les hôpitaux"
const disableOption = document.createElement('option');
disableOption.value = 'disable';
disableOption.textContent = 'Désactiver tous les hôpitaux';
hospitalSelect.appendChild(disableOption);
}

// 3. Ajouter un gestionnaire d'événements pour l'option de sélection de l'hôpital
// Déclarer une variable globale pour regrouper les marqueurs
let hospitalLayerGroup = L.layerGroup();

// Gestionnaire d'événements pour le sélecteur d'hôpitaux
document.getElementById('hospitalSelect').addEventListener('change', (event) => {
    const selectedValue = event.target.value;

    // Supprimer les marqueurs précédents
    if (hospitalLayerGroup) {
        hospitalLayerGroup.clearLayers();
    }

    if (selectedValue === 'all') {
        // Créer une nouvelle couche pour regrouper tous les marqueurs
        hospitalLayerGroup = L.layerGroup();

        // Ajouter tous les hôpitaux à la couche
        hospitalData.features.forEach(hospital => {
            const longitude = hospital.properties.lamda; // Vérifier que 'lamda' est bien la longitude
            const latitude = hospital.properties.alpha; // Vérifier que 'alpha' est bien la latitude

            if (longitude !== undefined && latitude !== undefined) {
                const latLng = [latitude, longitude];
                const marker = L.marker(latLng).bindPopup(`
                    <strong>Hôpital : ${hospital.properties.nom}</strong><br>
                    Commune : ${hospital.properties.nom_commun || 'Non spécifiée'}<br>
                `);
                hospitalLayerGroup.addLayer(marker); // Ajouter le marqueur à la couche
            }
        });

        // Ajouter la couche à la carte
        hospitalLayerGroup.addTo(map);

        // Ajuster la carte pour inclure tous les hôpitaux
        const allCoords = hospitalData.features.map(hospital => [
            hospital.properties.alpha,
            hospital.properties.lamda
        ]);
        if (allCoords.length > 0) {
            const bounds = L.latLngBounds(allCoords);
            map.fitBounds(bounds); // Ajuster le zoom pour afficher tous les points
        }
    } else if (selectedValue === 'disable') {
        // Désactiver tous les hôpitaux (supprimer les marqueurs)
        if (hospitalLayerGroup) {
            hospitalLayerGroup.clearLayers();
        }
        // Réinitialiser le sélecteur à sa valeur par défaut
        event.target.value = ''; // Réinitialisation du sélecteur
    } else if (selectedValue) {
        // Afficher un hôpital sélectionné
        const hospital = hospitalData.features.find(f => f.properties.nom === selectedValue);

        if (hospital) {
            const longitude = hospital.properties.lamda;
            const latitude = hospital.properties.alpha;

            if (longitude !== undefined && latitude !== undefined) {
                const latLng = [latitude, longitude];
                map.setView(latLng, 14);

                const marker = L.marker(latLng).bindPopup(`
                    <strong>Hôpital : ${hospital.properties.nom}</strong><br>
                    Commune : ${hospital.properties.nom_commun || 'Non spécifiée'}<br>
                `);
                hospitalLayerGroup.addLayer(marker); // Ajouter le marqueur sélectionné
                hospitalLayerGroup.addTo(map);
            } else {
                console.error('Coordonnées invalides pour l\'hôpital', selectedValue, longitude, latitude);
            }
        } else {
            console.error('Hôpital non trouvé dans les données', selectedValue);
        }
    } else {
        // Si aucune option n'est sélectionnée, supprimer tous les marqueurs
        if (hospitalLayerGroup) {
            hospitalLayerGroup.clearLayers();
        }
    }
});

// 3. Fonction pour remplir le sélecteur des communes
function populateCommuneSelect(data) {
    const communeSelect = document.getElementById('communeSelect');
    // Supprimer les options existantes (y compris "Sélectionner une commune")
    communeSelect.innerHTML = '';

    // Ajouter les options de communes dynamiquement
    data.features.forEach(feature => {
        const communeName = feature.properties.nom_commun; // Correction du nom de la propriété
        const option = document.createElement('option');
        option.value = communeName;
        option.textContent = communeName;
        communeSelect.appendChild(option);
    });
   
    

    
}
// 8. Ajouter un gestionnaire pour l'option de sélection "Épicentre"
// Référence pour stocker le cercle et le marqueur de l'épicentre
let epicentreCircle, epicentreMarker, epicentreLabel;

// Fonction pour afficher l'épicentre
// Fonction pour afficher l'épicentre
document.getElementById('showEpicentreButton').addEventListener('click', () => {
    // Vérifier si l'épicentre est déjà affiché
    if (epicentreMarker) {
        return; // Si un marqueur existe déjà, on ne fait rien
    }

    // Si l'épicentre n'est pas déjà affiché, charger les données et ajouter les composants
    fetch('epicentre.geojson') // Remplacez par le chemin de votre fichier GeoJSON d'épicentre
        .then(response => response.json())
        .then(data => {
            addEpicentreToMap(data); // Ajouter l'épicentre
        })
        .catch(error => {
            console.error("Erreur lors du chargement du fichier GeoJSON de l'épicentre : ", error);
        });

    // Masquer la barre de droite lorsque l'épicentre est activé
    const rightBar = document.getElementById('right-bar');
    rightBar.style.display = 'none';  // Masquer la barre de droite
});

// Fonction pour désactiver l'épicentre
document.getElementById('hideEpicentreButton').addEventListener('click', () => {
    if (epicentreCircle) {
        map.removeLayer(epicentreCircle); // Supprimer le cercle
    }
    if (epicentreMarker) {
        map.removeLayer(epicentreMarker); // Supprimer le marqueur
    }
    if (epicentreLabel) {
        map.removeLayer(epicentreLabel); // Supprimer l'étiquette
    }

    // Supprimer tous les cercles d'ondes
    const circles = map._layers;
    for (const layerId in circles) {
        const layer = circles[layerId];
        if (layer instanceof L.Circle && layer.options.fillColor === 'red') {
            map.removeLayer(layer); // Supprimer tous les cercles d'ondes
        }
    }

    // Réinitialiser les variables pour indiquer qu'il n'y a plus d'épicentre visible
    epicentreCircle = null;
    epicentreMarker = null;
    epicentreLabel = null;
});

// Fonction pour ajouter l'épicentre et ses ondes à la carte
function addEpicentreToMap(data) {
    const epicentre = data.features[0].geometry.coordinates;
    const epicentreLatLng = [epicentre[1], epicentre[0]];

    // Ajouter le marqueur de l'épicentre
    epicentreMarker = L.marker(epicentreLatLng).addTo(map)
        .bindPopup("Épicentre du séisme");

    // Ajouter des cercles d'ondes de séisme
    const numberOfWaves = 5; // Nombre d'ondes concentriques
    const maxRadius = 10000; // Rayon maximum (en mètres) des ondes

    for (let i = 1; i <= numberOfWaves; i++) {
        const radius = (maxRadius / numberOfWaves) * i; // Augmente le rayon à chaque itération
        const opacity = 1 - (i / numberOfWaves); // L'opacité diminue avec l'augmentation du rayon

        L.circle(epicentreLatLng, {
            color: 'red',
            fillColor: 'red',
            fillOpacity: opacity,
            radius: radius
        }).addTo(map);
    }

    // Ajouter une étiquette pour l'épicentre
    epicentreLabel = L.marker(epicentreLatLng, {
        icon: L.divIcon({
            className: 'epicentre-label',
            html: `
                <div style="font-size: 10px; color: #FF4500; font-weight: bold; background-color: white; padding: 1px 3px; border: 1px solid #FFFFFF; white-space: nowrap; border-radius: #FFFFFF;">PROVINCE D'Al HAOUZ</div>
                <div style="font-size: 11px; color: white; font-weight: bold; background-color: #FF4500; padding: 2px 5px; border: 1px solid #000; white-space: nowrap; display: inline-block; border-radius: 0px;">IGHIL</div>
            `,
            iconSize: [120, 0],
            iconAnchor: [-10, 20]
        })
    }).addTo(map);

    // Centrer et zoomer sur l'épicentre
    map.setView(epicentreLatLng, 11);  // Cette ligne fait le zoom sur l'épicentre
}

// 4. Fonction pour afficher les données sur la carte
// Fonction pour afficher les données sur la carte avec gestion des étiquettes
function displayGeojson(data) {
    if (geojsonLayer) {
        geojsonLayer.clearLayers(); // Supprimer les couches existantes
    }

    // Supprimer toutes les étiquettes existantes avant d'en ajouter de nouvelles
    document.querySelectorAll('.commune-label').forEach(label => label.remove());

    geojsonLayer = L.geoJSON(data, {
        style: feature => ({
            color: '#000000',  // Contour noir pour les communes
            weight: 1,         // Épaisseur du contour
            fillColor: getDamageColor(feature.properties.niveau_dmg), // Couleur de remplissage selon le niveau de dommage
            fillOpacity: 1      // Opacité totale des couleurs
        }),
        onEachFeature: (feature, layer) => {
            const props = feature.properties;

            // Ajouter une étiquette uniquement pour les communes actuellement affichées
            const latLng = layer.getBounds().getCenter(); // Centre de la commune
            const label = L.marker(latLng, {
    icon: L.divIcon({
        className: 'commune-label', // Classe CSS pour styliser
        html: `<span style="font-size: 10px;">${props.nom_commun}</span>` // Appliquer la taille de la police ici
    })
}).addTo(map);

            // Ajouter un popup pour la commune
            layer.bindPopup(`
                <strong>Commune : ${props.nom_commun}</strong><br>
                Superficie <br>(en Km²) : ${props.surface}<br>
                Population : ${props.pop2024}<br>
                Bâtiments endommagés : ${props.nb_bat_dmg}<br>
                Niveau de dommage : ${props.niveau_dmg}<br>
                Nombre d'hôpitaux : ${props.nbr_hopita}
            `);
        }
    }).addTo(map);
}

document.getElementById('communeSelect').addEventListener('change', (event) => {
    const communeName = event.target.value;

    if (communeName) {
        const commune = geojsonData.features.find(f => f.properties.nom_commun === communeName);

        if (commune) {
            // Centrer et zoomer sur la commune sélectionnée
            const bounds = L.geoJSON(commune).getBounds();
            map.fitBounds(bounds);

            // Afficher uniquement cette commune sur la carte
            const filteredData = {
                type: 'FeatureCollection',
                features: [commune]
            };
            displayGeojson(filteredData);
        }
    } else {
        // Si aucune commune n'est sélectionnée, afficher toutes les communes
        displayGeojson(geojsonData);
    }
});

// 5. Fonction pour centrer la carte sur la commune sélectionnée et afficher les informations dans le tableau
document.getElementById('communeSelect').addEventListener('change', (event) => {
    const communeName = event.target.value;
    const communeTable = document.getElementById('communeTable');
    const rightBar = document.getElementById('right-bar'); // Récupérer l'élément de la barre de droite

    if (communeName) {
        const commune = geojsonData.features.find(f => f.properties.nom_commun === communeName);

        if (commune) {
            // Centrer la carte sur la commune sélectionnée
            const bounds = L.geoJSON(commune).getBounds();
            map.fitBounds(bounds);

            // Mettre à jour le tableau avec les informations de la commune
            document.getElementById('communeName').textContent = commune.properties.nom_commun;
            document.getElementById('communeSurface').textContent = commune.properties.surface;
            document.getElementById('communePopulation').textContent = commune.properties.pop2024;
            document.getElementById('communeDamagedBuildings').textContent = commune.properties.nb_bat_dmg;
            document.getElementById('communeDamageLevel').textContent = commune.properties.niveau_dmg;
            document.getElementById('communeHospitals').textContent = commune.properties.nbr_hopita;

            // Afficher la barre de droite
            rightBar.style.display = 'block'; // Afficher la barre une fois la commune sélectionnée
        }
    } else {
        communeTable.innerHTML = `
            <thead>
                <tr>
                    <th>Nom de la Commune</th>
                    <th>Superficie<br>(en Km²)</th>
                    <th>Population</th>
                    <th>Bâtiments endommagés</th>
                    <th>Niveau de dommage</th>
                    <th>Nombre d'hôpitaux</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5" style="text-align: center;">Sélectionnez une commune pour afficher les informations.</td>
                </tr>
            </tbody>
        `;
        
        // Masquer la barre de droite si aucune commune n'est sélectionnée
        rightBar.style.display = 'none';
    }
});

        // 6. Fonction pour afficher les couleurs en fonction du niveau de dommage
        function getDamageColor(niveauDmg) {
    switch (niveauDmg) {
        case 'Aucun':
            return 'rgba(102, 204, 102, 0.7)'; // Vert avec 50% d'opacité
        case 'Faible':
            return 'rgba(255, 153, 51, 0.7)'; // Rouge clair avec 70% d'opacité
        case 'Modéré':
            return 'rgba(255, 69, 0, 0.7)'; // Rouge moyen avec 70% d'opacité
        case 'Élevé':
            return 'rgba(204, 0, 0, 0.7)'; // Rouge foncé avec 70% d'opacité
        case 'Critique':
            return 'rgba(153, 51, 51, 0.7)'; // Rouge très foncé avec 70% d'opacité
        default:
            return 'rgba(0, 0, 255, 0.7)'; // Bleu (pour les cas non spécifiés) avec 50% d'opacité
    }
}

        // 7. Appliquer un filtre pour afficher les communes selon le niveau de dommage
        // 7. Mettre à jour les communes affichées en fonction du niveau de dommage sélectionné
        document.getElementById('damageFilter').addEventListener('change', () => {
    const selectedDamage = document.getElementById('damageFilter').value;
    const rightBar = document.getElementById('right-bar'); // Sélecteur de la barre droite
    let filteredData = geojsonData;

    // Masquer la barre de droite
    rightBar.style.display = 'none';

    if (selectedDamage !== 'Tous') {
        filteredData = {
            type: 'FeatureCollection',
            features: geojsonData.features.filter(f => f.properties.niveau_dmg === selectedDamage)
        };
    }

    displayGeojson(filteredData);

    if (filteredData.features.length > 0) {
        const bounds = L.geoJSON(filteredData).getBounds();
        map.fitBounds(bounds, { maxZoom: 10 });
    }
});

// Gestion des sélections dans le menu déroulant
// Ajouter une étiquette pour indiquer le message
let infoLabel;

document.getElementById('buildingStatusSelect').addEventListener('change', (event) => {
    const selectedValue = event.target.value;

    // Supprimer les couches existantes
    if (damagedBuildingsLayer) map.removeLayer(damagedBuildingsLayer);
    if (undamagedBuildingsLayer) map.removeLayer(undamagedBuildingsLayer);

    // Supprimer l'étiquette si elle existe
    if (infoLabel) {
        map.removeLayer(infoLabel);
        infoLabel = null;
    }

    // Ajouter la couche correspondant à la sélection
    if (selectedValue === 'damaged') {
        if (damagedBuildingsLayer) {
            map.addLayer(damagedBuildingsLayer); // Ajouter les bâtiments touchés
            map.fitBounds(damagedBuildingsLayer.getBounds()); // Zoomer sur les bâtiments touchés

            // Ajouter l'étiquette pour les bâtiments touchés
            infoLabel = L.marker([30.883, -9], {
                icon: L.divIcon({
                    className: 'info-label',
                    html: 'Sélectionner un bâtiment pour obtenir ses informations.',
                    iconSize: [170, 30], // Ajustez la taille de l'étiquette
                })
            }).addTo(map);

            // Ajouter un événement pour supprimer l'étiquette au clic sur un bâtiment
            damagedBuildingsLayer.eachLayer(layer => {
                layer.on('click', () => {
                    if (infoLabel) {
                        map.removeLayer(infoLabel);
                        infoLabel = null;
                    }
                });
            });
        }
    } else if (selectedValue === 'undamaged') {
        if (undamagedBuildingsLayer) {
            map.addLayer(undamagedBuildingsLayer); // Ajouter les bâtiments non touchés
            map.fitBounds(undamagedBuildingsLayer.getBounds()); // Zoomer sur les bâtiments non touchés

            // Ajouter l'étiquette pour les bâtiments non touchés
            infoLabel = L.marker([30.883, -9], {
                icon: L.divIcon({
                    className: 'info-label',
                    html: 'Sélectionner un bâtiment pour obtenir ses informations.',
                    iconSize: [170, 30], // Ajustez la taille de l'étiquette
                })
            }).addTo(map);

            // Ajouter un événement pour supprimer l'étiquette au clic sur un bâtiment
            undamagedBuildingsLayer.eachLayer(layer => {
                layer.on('click', () => {
                    if (infoLabel) {
                        map.removeLayer(infoLabel);
                        infoLabel = null;
                    }
                });
            });
        }
    }
});