// TODO: Align the coordinates of crosses and circles. Currently, there is a small gap caused by the different svg sizes.
// TODO: Make sure that the whole code uses (x, y) form of coordinates. There are a few functions that use (y, x) representation.
// TODO: Add artificial intelligence as an opponent
// TODO: Fix the right diagonal winning line's offset
// TODO: Separate the code into multiple files for further lisibility

let FIELD_WIDTH = 450;
let FIELD_HEIGHT = 450;

let CIRCLE_STROKE_WIDTH = 4;
let CROSS_STROKE_WIDTH = 4;

let CIRCLE_COLOR = "red";
let CROSS_COLOR = "blue";

let winMessage = document.querySelector('.win-message');
let player1Score = document.getElementById('player1-score');
let player2Score = document.getElementById('player2-score');
let restartButton = document.getElementById('restart-button');
let whoseTurnInfo = document.querySelector('.whose-turn');

let field_div = document.getElementById("field");

function arrayRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function objectRandomValue(obj) {
    let values = [];
    for(const [key, value] of Object.entries(obj)) {
        values.push(value);
    }
    return arrayRandomElement(values);
}

function allEquals(arr) {
    if (arr.every(el => el === arr[0] && el !== '')) {
        return true;
    }
    return false;
}

function restartButtonClick() {
    winMessage.textContent = "";
    field.clearField();
    restartButton.disabled = true;
}

function initTextFields() {
    updateWhoseTurnTextField();

    player1Score.textContent = `Player ${Game.PLAYERS.player1.ID} Score: ${Game.PLAYERS.player1.SCORE}`;
    player1Score.style.color = Game.PLAYERS.player1.SIGN == 'o' ? CIRCLE_COLOR : CROSS_COLOR;

    player2Score.textContent = `Player ${Game.PLAYERS.player2.ID} Score: ${Game.PLAYERS.player2.SCORE}`;
    player2Score.style.color = Game.PLAYERS.player2.SIGN == 'o' ? CIRCLE_COLOR : CROSS_COLOR;

    restartButton.addEventListener("click", restartButtonClick);
    restartButton.disabled = false;
}

function updateWhoseTurnTextField() {
    whoseTurnInfo.textContent = `It's Player ${Game.WHOSE_TURN.ID}'s Turn`;
}

function updateTextFieldsOnWin(winner) {
    winMessage.textContent = `Player ${winner.ID} WON!`
    player1Score.textContent = `Player ${Game.PLAYERS.player1.ID} Score: ${Game.PLAYERS.player1.SCORE}`;
    player2Score.textContent = `Player ${Game.PLAYERS.player2.ID} Score: ${Game.PLAYERS.player2.SCORE}`;
    restartButton.disabled = false;
}

function updateTextFieldsOnDraw() {
    winMessage.textContent = "It's a draw!";
    player1Score.textContent = `Player ${Game.PLAYERS.player1.ID} Score: ${Game.PLAYERS.player1.SCORE}`;
    player2Score.textContent = `Player ${Game.PLAYERS.player2.ID} Score: ${Game.PLAYERS.player2.SCORE}`;
    restartButton.disabled = false;
}

class Field {
    constructor(width, height, stroke_width, extra_width, extra_height) {
        this.LINE_COLOR = "black";

        // Width of line strokes
        this.STROKE_WIDTH = stroke_width;
        
        // Extra width/height to widen the field 
        this.EXTRA_WIDTH = extra_width;
        this.EXTRA_HEIGHT = extra_height;
        
        // Base width/height without additional parameters like stroke width, extra size, cell size, gap. 
        this.ORIGIN_WIDTH = width;
        this.ORIGIN_HEIGHT = height;

        // The functions must be called in this specific order to calculate all the necessary values
        this.#calculateSize();
        this.#calculateCellSize();
        this.#calculateGap();

        console.log(`Cell width: ${this.CELL_WIDTH}, Cell height: ${this.CELL_HEIGHT}`);
        console.log(`Gap horizontal: ${this.GAP_X}, Gap vertical: ${this.GAP_Y}`);

        this.#createSVGField()

        this.createCells();

        this.callbackRunning = false;
        this.checkWinCallbackID = setInterval(this.checkWin.bind(this), 500);
    }

    disable() {
        this.CELLS.forEach(cell => {
            cell.UPDATED = true;
        });
    }

    clearField() {
        let cells = document.querySelectorAll(".cell");

        cells.forEach(cell => {
            field_div.removeChild(cell);
        });

        this.CELLS = [];

        Game.clear_field();

        this.createCells();

        if (!this.callbackRunning) {
            this.checkWinCallbackID = setInterval(this.checkWin.bind(this), 500);
            this.callbackRunning = true;
        }
    }

    checkWin() {
        let winner = Game.checkWinner();
        if (winner) {
            winner.player.SCORE++;

            updateTextFieldsOnWin(winner.player);
            let winningLineColor;
            if (winner.player.SIGN == 'o') {
                winningLineColor = CIRCLE_COLOR;
            }
            else if (winner.player.SIGN == 'x') {
                winningLineColor = CROSS_COLOR;
            }
            this.drawWinningLine(winner.combinationCoords, winner.lineType, winningLineColor);
            this.disable();

            clearInterval(this.checkWinCallbackID);
            this.callbackRunning = false;
        }
        else if(Game.GAME_FIELD.isFull()) {
            updateTextFieldsOnDraw();

            this.disable();

            clearInterval(this.checkWinCallbackID);
            this.callbackRunning = false;
        }
    }

    drawWinningLine(combinationCoords, lineType, lineColor) {
        let winningLine = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        winningLine.setAttribute("class", "cell");
        winningLine.setAttribute("width", `${this.WIDTH}`);
        winningLine.setAttribute("height", `${this.HEIGHT}`);
        winningLine.setAttribute("viewBox", `0 0 ${this.WIDTH} ${this.HEIGHT}`);

        let startCellCoords = this.CELLS[combinationCoords.start.y][combinationCoords.start.x].COORDS;
        let endCellCoords = this.CELLS[combinationCoords.end.y][combinationCoords.end.x].COORDS;

        let lineCoords = new Line(
            new Coordinate({
                x: startCellCoords.x,
                y: startCellCoords.y
            }), 
            new Coordinate({
                x: endCellCoords.x,
                y: endCellCoords.y
            })
        );

        let offsetStartX = 0;
        let offsetStartY = 0;
        let offsetEndX = 0;
        let offsetEndY = 0;

        if (lineType === "horizontal") {
            offsetEndX = this.CELL_WIDTH;
            offsetEndY = this.CELL_HEIGHT / 2;
            offsetStartY = this.CELL_HEIGHT / 2;
        }
        else if (lineType === "vertical") {
            offsetEndX = this.CELL_WIDTH / 2;
            offsetEndY = this.CELL_HEIGHT;
            offsetStartX = this.CELL_WIDTH / 2;
        }
        else if (lineType === "diagonal-left") {
            offsetEndX = this.CELL_WIDTH;
            offsetEndY = this.CELL_HEIGHT;
        }
        else if (lineType === "diagonal-right") {
            offsetStartX = this.CELL_WIDTH;
            offsetEndY = this.CELL_HEIGHT;
        }

        let svgLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svgLine.setAttribute("d", `
            M ${lineCoords.startX + offsetStartX},${lineCoords.startY + offsetStartY}
            L ${lineCoords.endX + offsetEndX},${lineCoords.endY + offsetEndY}
        `);
        svgLine.setAttribute("class", "win-line");
        // svgLine.setAttribute("fill", "black");
        svgLine.setAttribute("stroke", `${lineColor}`);
        svgLine.setAttribute("stroke-width", "5");
        svgLine.setAttribute("stroke-dashoffset", `1000`);
        svgLine.setAttribute("stroke-dasharray", "1000");

        winningLine.style.left = `0px`;
        winningLine.style.top = `0px`;

        winningLine.appendChild(svgLine);

        field_div.appendChild(winningLine);
    }

    #calculateSize() {
        // Multiplication by 2 because we gotta add the extra width/height for 2 sides
        this.WIDTH = this.ORIGIN_WIDTH + (this.EXTRA_WIDTH * 2) + (this.STROKE_WIDTH * 2); 
        this.HEIGHT = this.ORIGIN_HEIGHT + (this.EXTRA_HEIGHT * 2) + (this.STROKE_WIDTH * 2);
    }

    #calculateCellSize() {
        this.CELL_WIDTH = Math.floor(this.ORIGIN_WIDTH / 3) - 10;//(Math.floor(this.ORIGIN_WIDTH / 3) % 10);
        this.CELL_HEIGHT = Math.floor(this.ORIGIN_HEIGHT / 3) - 10;//(Math.floor(this.ORIGIN_HEIGHT / 3) % 10);
    }

    #calculateGap() {
        this.GAP_X = Math.floor((this.ORIGIN_WIDTH - (this.CELL_WIDTH * 3)) / 4);
        this.GAP_Y = Math.floor((this.ORIGIN_HEIGHT - (this.CELL_HEIGHT * 3)) / 4);
    }

    calculateFieldCoordsByPosition(y, x) {
        // (0, 1)
        // (1, 2)
        // (2, 2)
        return new Coordinate({
            x: this.EXTRA_WIDTH + (this.CELL_WIDTH * x) + (this.GAP_X * (x * 2)) + (this.STROKE_WIDTH * x),
            y: this.EXTRA_HEIGHT + (this.CELL_HEIGHT * y) + (this.GAP_Y * (y * 2)) + (this.STROKE_WIDTH * y)
        });
    }

    createCells() {
        this.CELLS = [
            [
                new Cell(1, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(0, 0)),
                new Cell(2, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(0, 1)),
                new Cell(3, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(0, 2)),
            ],

            [
                new Cell(4, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(1, 0)),
                new Cell(5, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(1, 1)),
                new Cell(6, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(1, 2)),
            ],

            [
                new Cell(7, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(2, 0)),
                new Cell(8, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(2, 1)),
                new Cell(9, this.CELL_WIDTH, this.CELL_HEIGHT, this.calculateFieldCoordsByPosition(2, 2)),
            ]
        ];
    }

    #createSVGField() {
        /*
        x0    x0
      y0########y1    
        #     #
        #     #
      y0########y1
        #     #
        x1    x1
            */
        let verticalLine1 = new Line(
            new Coordinate({
                x: this.EXTRA_WIDTH + this.CELL_WIDTH + this.GAP_X,
                y: 0
            }), 
            new Coordinate({
                x: this.EXTRA_WIDTH + this.CELL_WIDTH + this.GAP_X,
                y: this.EXTRA_HEIGHT * 2 + this.GAP_Y * 4 + this.CELL_HEIGHT * 3 + this.STROKE_WIDTH * 2
            })
        );
    
        let verticalLine2 = new Line(
            new Coordinate({
                x: this.EXTRA_WIDTH + this.CELL_WIDTH * 2 + this.GAP_X * 3 + this.STROKE_WIDTH,
                y: 0
            }), 
            new Coordinate({
                x: this.EXTRA_WIDTH + this.CELL_WIDTH * 2 + this.GAP_X * 3 + this.STROKE_WIDTH,
                y: this.EXTRA_HEIGHT * 2 + this.GAP_Y * 4 + this.CELL_HEIGHT * 3 + this.STROKE_WIDTH * 2
            })
        );
    
        let horizontalLine1 = new Line(
            new Coordinate({
                x: 0,
                y: this.EXTRA_HEIGHT + this.GAP_Y + this.CELL_HEIGHT
            }), 
            new Coordinate({
                x: this.EXTRA_WIDTH * 2 + this.CELL_WIDTH * 3 + this.GAP_X * 4 + this.STROKE_WIDTH * 2,
                y: this.EXTRA_HEIGHT + this.GAP_Y + this.CELL_HEIGHT
            })
        );
    
        let horizontalLine2 = new Line(
            new Coordinate({
                x: 0,
                y: this.EXTRA_HEIGHT + this.GAP_Y * 3 + this.CELL_HEIGHT * 2 + this.STROKE_WIDTH
            }), 
            new Coordinate({
                x: this.EXTRA_WIDTH * 2 + this.CELL_WIDTH * 3 + this.GAP_X * 4 + this.STROKE_WIDTH * 2,
                y: this.EXTRA_HEIGHT + this.GAP_Y * 3 + this.CELL_HEIGHT * 2 + this.STROKE_WIDTH
            })
        );
        // TODO: Change the svgField element to a native one. Meaning that you gotta use function createElement()
        this.svgField = `
        <svg width="${this.WIDTH}" height="${this.HEIGHT}" viewBox="0 0 ${this.WIDTH} ${this.HEIGHT}">
            <path d="
                M ${verticalLine1.startX},${verticalLine1.startY}
                L ${verticalLine1.endX},${verticalLine1.endY}
                M ${verticalLine2.startX},${verticalLine2.startY}
                L ${verticalLine2.endX},${verticalLine2.endY}
                M ${horizontalLine1.startX},${horizontalLine1.startY}
                L ${horizontalLine1.endX},${horizontalLine1.endY}
                M ${horizontalLine2.startX},${horizontalLine2.startY}
                L ${horizontalLine2.endX},${horizontalLine2.endY}
            " fill="${this.LINE_COLOR}" stroke="${this.LINE_COLOR}" stroke-width="${this.STROKE_WIDTH}" />
        </svg>
        `;

        field_div.innerHTML += this.svgField;
    }
}

class Player {
    constructor(player_id, sign) {
        this.ID = player_id;
        this.SIGN = sign;
        this.SCORE = 0;
    }
}

class GameField {
    /*
        ['', '', '']
        ['', '', '']
        ['', '', '']
    */

    constructor(field_width, field_height) {
        this.WIDTH = field_width;
        this.HEIGHT = field_height;
        this.FIELD = this.initGameField();
    }

    indexOf(element) {
        return this.FIELD.indexOf(element);
    }

    get rowLength() {
        return this.FIELD.length;
    }

    get columnLength() {
        // try{}
        // Can throw an exception if there are no elements in the array
        return this.FIELD[0].length;
    }

    get(y = 0, x = 0) {
        return this.FIELD[y][x];
    }

    set(y, x, value) {
        this.FIELD[y][x] = value; 
    }

    isFull() {
        for (let row = 0; row < this.rowLength; row++) {
            for (let col = 0; col < this.columnLength; col++) {
                if (this.get(row, col) == '') {
                    return false;
                }
            }
        }
        return true;
    }

    clear() {
        this.FIELD = this.initGameField();
    }

    getVerticalLines() {
        let verticalLines = [];
        for(let x = 0; x < this.FIELD[0].length; x++) {
            // Getting the vertical line of the game field
            let verticalLine = this.FIELD.map(el => el[x]);
            verticalLines.push(verticalLine);
        }
        return verticalLines;
    }

    getHorizontalLines() {
        let horizontalLines = [];
        for(let y = 0; y < this.FIELD.length; y++) {
            // Getting the horizontal line of the game field
            let horizontalLine = this.FIELD[y];
            horizontalLines.push(horizontalLine);
        }
        return horizontalLines;
    }

    getDiagonals() {
        // Getting the first diagonal
        let x = 0;
        let y = 0;

        let diagonal1 = [];
        while(y < this.FIELD.length) {
            diagonal1.push(this.FIELD[y][x]);
            x++;
            y++;
        }

        // Getting the second diagonal
        x = this.FIELD[0].length - 1;
        y = 0;

        let diagonal2 = [];
        while(y < this.FIELD.length) {
            diagonal2.push(this.FIELD[y][x]);
            x--;
            y++;
        }
        
        return {
            left: diagonal1,
            right: diagonal2
        }
    }

    initGameField() {
        let field = [];
        for (let row = 0; row < this.HEIGHT; row++) {
            let arr = [];
            for (let column = 0; column < this.WIDTH; column++) {
                arr.push('');
            }
            field.push(arr);
        }
        return field;
    }
}

class Game {
    static {
        this.GAME_FIELD = new GameField(3, 3);
        this.PLAYERS = this.initPlayers();
        this.WHOSE_TURN = objectRandomValue(this.PLAYERS);
    }
        
    static togglePlayer() {
        if (this.WHOSE_TURN == this.PLAYERS.player1) {
            this.WHOSE_TURN = this.PLAYERS.player2;
        }
        else if(this.WHOSE_TURN == this.PLAYERS.player2) {
            this.WHOSE_TURN = this.PLAYERS.player1;
        }
    }

    static clear_field() {
        this.GAME_FIELD.clear();
    }

    static initPlayers() {
        let player1Sign = arrayRandomElement(['o', 'x']);
        let player2Sign = player1Sign == 'o' ? 'x' : 'o';
        return {player1: new Player(1, player1Sign), player2: new Player(2, player2Sign)};
    }

    static updateGameField(cell_id) {
        // 1: (0, 0); 2: (0, 1); 3: (0, 2)
        // 4: (1, 0); 5: (1, 1); 6: (1, 2)
        // 7: (2, 0); 8: (2, 1); 9: (2, 2)
        // (y, x)

        // Calculating cell position (y, x) based on its ID

        let div = Math.floor(cell_id / 3);
        let mod = cell_id % 3; 

        let row = mod > 0 ? div: div - 1;
        let col = mod > 0 ? mod - 1: 2;

        this.GAME_FIELD.set(row, col, this.WHOSE_TURN.SIGN);
    }

    static getPlayerBySign(sign) {
        if (this.PLAYERS.player1.SIGN === sign) {
            return this.PLAYERS.player1;
        }
        else if (this.PLAYERS.player2.SIGN === sign) {
            return this.PLAYERS.player2;
        }
    }

    static checkWinner() {

        // Checking horizontal lines
        let horizontalLines = this.GAME_FIELD.getHorizontalLines();
        for(let y = 0; y < horizontalLines.length; y++) {
            let horizontalLine = horizontalLines[y];
            if (allEquals(horizontalLine)) {
                return {
                    player: this.getPlayerBySign(horizontalLine[0]),
                    combinationCoords: {
                        start: new Coordinate({y: y, x: 0}), 
                        end: new Coordinate({y: y, x: horizontalLine.length - 1})
                    },
                    lineType: "horizontal"
                };
            }
        }

        // Checking vertical lines
        let verticalLines = this.GAME_FIELD.getVerticalLines();
        for(let x = 0; x < verticalLines.length; x++) {
            let verticalLine = verticalLines[x];
            if (allEquals(verticalLine)) {
                return {
                    player: this.getPlayerBySign(verticalLine[0]),
                    combinationCoords: {
                        start: new Coordinate({y: 0, x: x}), 
                        end: new Coordinate({y: verticalLine.length - 1, x: x})
                    },
                    lineType: "vertical"
                };
            }
        }

        // Checking diagonal lines
        for(const [key, line] of Object.entries(this.GAME_FIELD.getDiagonals())) {
            if (allEquals(line)) {
                let winner = {
                    player: this.getPlayerBySign(line[0])
                };

                if (key == 'left') {
                    winner.combinationCoords = {
                        start: new Coordinate({y: 0, x: 0}), 
                        end: new Coordinate({y: 2, x: 2})
                    };
                    winner.lineType = "diagonal-left";
                    return winner;
                }
                else if (key == 'right') {
                    winner.combinationCoords = {
                        start: new Coordinate({y: 0, x: 2}), 
                        end: new Coordinate({y: 2, x: 0})
                    };
                    winner.lineType = "diagonal-right";
                    return winner;
                }
                
            }
        }

        return false;
    }   

    
}

class Cell {
    // If we create an instance of Cell, it will create an empty cell without any drawings
    constructor(cell_id, cell_width, cell_height, coordinates) {
        this.ID = cell_id
        this.WIDTH = cell_width;
        this.HEIGHT = cell_height;
        this.COORDS = coordinates;
        this.CELL_TYPE = null;
        this.UPDATED = false;
        
        this.createContainer();

        this.container.addEventListener("click", e => this.update_cell(e));
    }

    createContainer() {
        this.container = document.createElement("div");
        this.container.setAttribute("id", `cell${this.ID}`);
        this.container.setAttribute("class", "cell");
        this.container.style.width = `${this.WIDTH}px`;
        this.container.style.height = `${this.HEIGHT}px`;
        this.container.style.left = `${this.COORDS.x}px`;
        this.container.style.top = `${this.COORDS.y}px`;
        
        field_div.append(this.container);
    }

    update_cell(e) {
        if (!this.UPDATED) {
            if(Game.WHOSE_TURN.SIGN === 'o') {
                this.CELL_TYPE = new Circle(this, CIRCLE_STROKE_WIDTH, CIRCLE_COLOR);
                Game.updateGameField(this.ID);
                this.UPDATED = true;
            } 
            else if (Game.WHOSE_TURN.SIGN === 'x') {
                this.CELL_TYPE = new Cross(this, CROSS_STROKE_WIDTH, CROSS_COLOR);
                Game.updateGameField(this.ID);
                this.UPDATED = true;
            }
            Game.togglePlayer();
            updateWhoseTurnTextField();
        }
    }
}

class Circle {
    // Cell with a circle
    constructor(cell, stroke_width, stroke_color = "black") {
        this.STROKE_WIDTH = stroke_width;
        this.COLOR = stroke_color;
        this.CELL = cell;

        this.createSVGCircle();
    }

    createSVGCircle() {
        // If you do just createElement("svg") it's not going to work and the console won't say anything about it.
        let svgCircle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgCircle.setAttribute("class", "cell-svg");
        svgCircle.setAttribute("width", `${this.CELL.WIDTH}`);
        svgCircle.setAttribute("height", `${this.CELL.HEIGHT}`);
        svgCircle.setAttribute("viewBox", `0 0 ${this.CELL.WIDTH} ${this.CELL.HEIGHT}`);

        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle"); 
        circle.setAttribute("cx", `${this.CELL.WIDTH / 2 - 2}`); // x center
        circle.setAttribute("cy", `${this.CELL.HEIGHT / 2 - 2}`); // y center
        circle.setAttribute("r", `${this.CELL.WIDTH / 2 - 5}`); // radius
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("stroke", `${this.COLOR}`);
        circle.setAttribute("stroke-width", `${this.STROKE_WIDTH}`);

        svgCircle.appendChild(circle);
    
        this.CELL.container.appendChild(svgCircle);
    }
}

class Cross {
    constructor(cell, stroke_width, stroke_color = "black") {
        this.STROKE_WIDTH = stroke_width;
        this.COLOR = stroke_color;
        this.CELL = cell;

        this.createSVGCross();
    }

    createSVGCross() {
        let svgCross = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgCross.setAttribute("class", "cell-svg");
        svgCross.setAttribute("width", `${this.CELL.WIDTH}`);
        svgCross.setAttribute("height", `${this.CELL.HEIGHT}`);
        svgCross.setAttribute("viewBox", `0 0 ${this.CELL.WIDTH} ${this.CELL.HEIGHT}`);

        let crossSize = this.CELL.HEIGHT - 20;

        let cross_line1 = new Line(
            new Coordinate({
                x: 0,
                y: 0
            }), 
            new Coordinate({
                x: crossSize,
                y: crossSize
            })
        );

        let cross_line2 = new Line(
            new Coordinate({
                x: crossSize,
                y: 0
            }), 
            new Coordinate({
                x: 0,
                y: crossSize
            })
        );

        
        let cross = document.createElementNS("http://www.w3.org/2000/svg", "path");
        cross.setAttribute("d", `
            M ${cross_line1.startX}, ${cross_line1.startY}
            L ${cross_line1.endX},${cross_line1.endY}
            M ${cross_line2.startX}, ${cross_line2.startY}
            L ${cross_line2.endX},${cross_line2.endY}
        `);
        cross.setAttribute("fill", "black");
        cross.setAttribute("stroke", `${this.COLOR}`);
        cross.setAttribute("stroke-width", `${this.STROKE_WIDTH}`);

        svgCross.appendChild(cross);

        this.CELL.container.appendChild(svgCross);
    }
}

class Coordinate {
    constructor(coordinate_obj) {
        this.x = coordinate_obj.x;
        this.y = coordinate_obj.y;
    }
}

class Line {
    constructor(start_coordinate, end_coordinate) {
        this.start = start_coordinate;
        this.end = end_coordinate;
    }

    get startX() {
        return this.start.x;
    }

    get startY() {
        return this.start.y;
    }

    get endX() {
        return this.end.x;
    }

    get endY() {
        return this.end.y;
    }
}

field_div.style.width = FIELD_WIDTH + (FIELD_WIDTH / 10);
field_div.style.height = FIELD_HEIGHT + (FIELD_HEIGHT / 10);

let field = new Field(FIELD_WIDTH, FIELD_HEIGHT, 4, 15, 15);

initTextFields();