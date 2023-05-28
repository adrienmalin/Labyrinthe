// Customize Array to be use as coordinates
Object.defineProperties(Array.prototype, {
    "x": {
        get: function() { return this[0] },
        set: function(x) { this[0] = x }
    },
    "y": {
        get: function() { return this[1] },
        set: function(y) { this[1] = y }
    }
})
Array.prototype.plus = function (other) {
    return this.map((x, i) => x + other[i]);
};

const DIRECTION = {
    'BAS': 0,
    'GAUCHE': 1,
    'DROITE': 2,
    'HAUT': 3,
};

const MOUVEMENT = {
    'ARRET': [0, 0],
    'BAS': [0, 1],
    'HAUT': [0, -1],
    'GAUCHE': [-1, 0],
    'DROITE': [1, 0],
};

const ACTIONS = {
    'ArrowUp': { 'direction': DIRECTION.HAUT, 'mouvement': MOUVEMENT.HAUT },
    'z': { 'direction': DIRECTION.HAUT, 'mouvement': MOUVEMENT.HAUT },
    'ArrowDown': { 'direction': DIRECTION.BAS, 'mouvement': MOUVEMENT.BAS },
    's': { 'direction': DIRECTION.BAS, 'mouvement': MOUVEMENT.BAS },
    'ArrowLeft': { 'direction': DIRECTION.GAUCHE, 'mouvement': MOUVEMENT.GAUCHE },
    'q': { 'direction': DIRECTION.GAUCHE, 'mouvement': MOUVEMENT.GAUCHE },
    'ArrowRight': { 'direction': DIRECTION.DROITE, 'mouvement': MOUVEMENT.DROITE },
    'd': { 'direction': DIRECTION.DROITE, 'mouvement': MOUVEMENT.DROITE },
};

const TYPE = {
    'MUR': 1,
    'SOL': 2,
    'PAS': 3,
};

const DIRECTIONS_LABYRINTHE = [MOUVEMENT.BAS, MOUVEMENT.HAUT, MOUVEMENT.GAUCHE, MOUVEMENT.DROITE];
const TAILLE_TUILE = 15;

function dessinerTuile(context, image, x, y) {
    context.drawImage(image, TAILLE_TUILE * x, TAILLE_TUILE * y);
}

class Labyrinthe extends Array {
    constructor(largeur, hauteur, context, tuiles) {
        super();
        this.hauteur = hauteur;
        this.largeur = largeur;
        this.context = context;
        this.tuiles = tuiles;
        for (var ligne = 0; ligne < hauteur; ligne++) {
            this.push(Array(largeur).fill(TYPE.MUR));
        }
        this.positionInitiale = [1, 1];
        this.positionFinale = [largeur - 2, hauteur - 2];
        this.creuse(this.positionFinale);
        this.construit(this.positionFinale);
    }

    construit(position) {
        for (var direction of Array.from(DIRECTIONS_LABYRINTHE).sort(x => 0.5 - Math.random())) {
            var pas1 = position.plus(direction);
            var pas2 = pas1.plus(direction);
            if (this.type(pas2) == TYPE.MUR) {
                this.creuse(pas1);
                this.creuse(pas2);
                this.construit(pas2);
            }
        }
    }

    creuse(position) {
        this[position.y][position.x] = TYPE.SOL;
    }

    type(position) {
        if (
            0 <= position.x &&
            position.x < this.largeur &&
            0 <= position.y &&
            position.y < this.hauteur
        ) {
            return this[position.y][position.x];
        } else {
            return -1;
        }
    }

    dessiner() {
        this.forEach((ligne, y) => {
            ligne.forEach((type, x) => {
                dessinerTuile(this.context, this.tuiles[type], x, y);
            });
        });
    }
}

class Souris {
    constructor(position, context, sprites) {
        this.position = position;
        this.context = context;
        this.sprites = sprites;
        this.futurePosition = this.position;
        this.direction = DIRECTION.DROITE;
        this.mouvement = MOUVEMENT.ARRET;
        this.tailleSprite = 48;
        this.animationSprite = 0;
        this.animation = 0;
    }

    bouger(touche, labyrinthe) {
        if (touche in ACTIONS) {
            this.direction = ACTIONS[touche].direction;
            this.mouvement = ACTIONS[touche].mouvement;
            var futurePosition = this.position.plus(this.mouvement);
            if ([TYPE.SOL, TYPE.PAS].includes(labyrinthe.type(futurePosition))) {
                labyrinthe[this.position.y][this.position.x] = TYPE.PAS;
                this.futurePosition = futurePosition;
                return true;
            } else {
                this.mouvement = MOUVEMENT.ARRET;
                this.animation = 0;
                return false;
            }
        } else {
            return False;
        }
    }

    dessiner() {
        this.context.drawImage(
            this.sprites,
            this.tailleSprite * this.animationSprite,
            this.tailleSprite * this.direction,
            this.tailleSprite,
            this.tailleSprite,
            TAILLE_TUILE * this.position.x - 17 + this.mouvement.x * this.animation,
            TAILLE_TUILE * this.position.y - 12 + this.mouvement.y * this.animation,
            this.tailleSprite,
            this.tailleSprite
        );
    }
}

window.onload = function () {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var fromage = document.getElementById('fromage');
    var sourisSprites = document.getElementById('souris');
    var tuiles = {};
    tuiles[TYPE.MUR] = document.getElementById('mur');
    tuiles[TYPE.SOL] = document.getElementById('sol');
    tuiles[TYPE.PAS] = document.getElementById('pas');

    var touchesPressees = new this.Set();

    var largeur = Math.floor(window.innerWidth / TAILLE_TUILE);
    largeur = largeur - ((largeur + 1) % 2);
    var hauteur = Math.floor(window.innerHeight / TAILLE_TUILE);
    hauteur = hauteur - ((hauteur + 1) % 2);

    canvas.width = largeur * TAILLE_TUILE;
    canvas.height = hauteur * TAILLE_TUILE;

    var labyrinthe = new Labyrinthe(largeur, hauteur, ctx, tuiles);
    var souris = new Souris(labyrinthe.positionInitiale, ctx, sourisSprites);

    window.onkeydown = function (event) {
        if (event.key in ACTIONS) {
            touchesPressees.add(event.key);
            return false;
        } else {
            return true;
        }
    };

    window.onkeyup = function (event) {
        if (event.key in ACTIONS) {
            touchesPressees.delete(event.key);
            return false;
        } else {
            return true;
        }
    };

    var timerID;
    timerID = setInterval(function () {
        if (touchesPressees.size > 0) souris.animationSprite = (souris.animationSprite + 1) % 3;
        if (souris.mouvement != MOUVEMENT.ARRET) {
            souris.animation += 5;
            if (souris.animation >= TAILLE_TUILE) {
                souris.animation = 0;
                souris.position = souris.futurePosition;
                if (
                    souris.position.x == labyrinthe.positionFinale.x &&
                    souris.position.y == labyrinthe.positionFinale.y
                ) {
                    window.alert('Miam miam !');
                    clearInterval(timerID);
                }
            }
        }
        if (souris.animation == 0) {
            souris.mouvement = MOUVEMENT.ARRET;
            for (touche of Array.from(touchesPressees).reverse()) {
                if (souris.bouger(touche, labyrinthe)) break;
            }
        }

        labyrinthe.dessiner();
        dessinerTuile(ctx, fromage, labyrinthe.positionFinale.x, labyrinthe.positionFinale.y);
        souris.dessiner();
    }, 40);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }
};
