# Prompt QR application

# Contexte

Dans le contexte de la réalisation d’une application open source en react/electron visant la création de QR Code (avec des liens seulement) avec pleins de features additionelles, nous sommes une équipe d’ingénieurs informatiques seniors qui ont pour but de réaliser ce projet. Tu es également un ingénieur informatique senior dans ce contexte, et tu nous aideras en challengeant nos idées, proposant des solutions et modifications innovantes et développant la solution en nous créant une base fonctionnelle et modulable afin qu’on puisse la reprendre et l’élargir.

Tu trouveras suite à ce texte les détails techniques concernant à la fois le front et back afin de t’aider a réaliser la base du projet.

# UI/UX

Guidelines :

- Utiliser lucidchart icon pour les icons
- Faire des composants réutilisable
- Faire une architecture claire (page, components, …)
- Un style simple et épuré, comme notion
- Fait un fichier de style central pour facilement modifier le style de toute l’application
- Evite de faire des redites dans l’ui

Voici une explication page par page de l’experience utilisateur pour cette application :

- Tu vas créer déjà une premiere page d’accueil/landing page :
    - Le titre de l’application
    - Tout les anciennes configurations sauvegardés avec une petite image de preview (screenshot pris pendant la configuration)
    - Un bouton “creer nouveau” pour partir de zero
    - en bas a droite : icon button setting
- Tu vas créer une page de choix pour le type d’activité que l’on veux faire avec 4 grands boutons (text icons) en alignées a l’horizontal
    - Créer un QRCode tout seul
    - Créer une carte de visite avec un QRCode
    - Integrer a un document (image ou pdf)
    - Scanner un QR code (a partir d’une image importé, pas de webcam pour l’instant)
- Tu vas créer la page de configuration et de personnalisation
    - La preview sera a gauche, les parametres de configuration seront a droite
    - en bas du panneau de preview, tu mettras un bouton raw export, qui exportera le QR pure sans personnalisation.
    - en bas a gauche de la page, tu a un bouton “export”
    - en haut du panneau de configuration,  tu vas mettre une barre avec :
        - QRCode tout seul
        - carte de visite
        - document
        
        Cela permettra de basculer d’une activité a une autre de maniere dynamique. Le fichier configuration restera le meme entre toutes activités pour les que les modification sur le QR code puissent persister d’une activitée a une autre.
        
    - A la toute droite de cette barre, tu mettras un icon button de settings (roue cranté) et de meme pour la sauvegarde de la configuration
    - La sauvegarde ouvrira un explorateur de fichier
    - Les reglages seront en popup
        - Emplacement du fichier de config de l’app
        - Emplacement par defaut des fichier de config des projets (la config l’app sauvegarde les chemins des fichier recents)
    - la taille des deux panneau sont resizable avec la barre centrale qui les separent
- Pour la page de scan de QR code
    - Meme layout que les page de  personnalisation
    - Sur la preview, une preview du site du qr code
    - Sur droite, le lien, avec une option pour copier
- Tu vas créer une page d’exportation :
    - Meme layout preview / config
    - dans panneau de config :
        - Tu fais une card par type de fichier
            - png
            - pdf
            - svg
        - tu penseras a un integrer des option pour gerer l’exportation par batch
            - batch naming
            - export en zip

# Backend

Le backend doit-être en type script. Il est intégré à l’application React Electron.

Le backend doit pouvoir créer des QR codes et les sauvegarder de plusieurs manières.

On doit pouvoir:

- créer des QR codes simples et personnalisables (exportable sous png, svg, pdf…). La personnalisation du QR code doit inclure: changer la taille, la couleur, les formes (coins ronds, carrés, et autres formes possibles avec la librairie utilisée). (qr-code-styling, chroma-js, pdf-lib)
- créer des cartes de visite simples et personnalisables contenant des QR codes qu’on a créés (exportable sous png, svg, pdf…). Les cartes doivent être aussi personnalisables que les QR codes, mais on doit pouvoir rajouter du texte où on veut et le personnaliser. (pdf-lib, jimp)
- modifier des pdf et des images pour ajouter des QR codes qu’on a créés. (pdf-lib)
- récupérer le lien associé à un QR code en partant de ce dernier. (jsqr)

Tout ça à partir de fichiers de configuration JSON qu’on peut sauvegarder pour pouvoir recréer des QR codes similaires ou cartes de visite similaires.

qr-code-styling → personalisation Qr Code  [https://www.npmjs.com/package/qr-code-styling-node](https://www.npmjs.com/package/qr-code-styling-node)

jimp → gestion images [https://www.npmjs.com/package/jimp](https://www.npmjs.com/package/jimp)

pdf-lib → création PDF [https://www.npmjs.com/package/pdf-lib](https://www.npmjs.com/package/pdf-lib)

chroma-js → s'assurer que le QR code restera lisible par un smartphone [https://www.npmjs.com/package/chroma-js](https://www.npmjs.com/package/chroma-js)

jsqr → décoder les QR codes à partir de données de pixels brutes [https://www.npmjs.com/package/jsqr](https://www.npmjs.com/package/jsqr)