(function ($, Helper) {
    //#region vars
    var g_virtualBoard;
    var g_board = $(".board")[0];
    var g_currColumn;
    var g_currRow;
    var g_thisPlayer;
    var id = 1;
    var g_$winner = $('.winner');
    var g_$startStandard = $('.startStandard');
    var g_$startHard = $('.startHard');
    var g_easyMode = false;
    //#endregion vars

    //#region Doc Ready
    $().ready(function () {
        g_$startStandard.on('click', startStandard);
        g_$startHard.on('click', startHard);
    });

    //#endregion Doc Ready

    function startStandard() {
        g_easyMode = true;
        start();
    }

    function startHard() {
        g_easyMode = false;
        $('body').css("background-color", "#B42626");
        start();
    }

    function start() {
        g_board.innerHTML = "";
        $(g_board).unload();
        g_$startStandard.hide();
        g_$startHard.hide();
        g_$winner.hide();
        g_virtualBoard = Game.Struct.Helper.CreateBoard();
        blockPlacement(2);
    }

    function setAtRow(y, player) {
        for (var x = 0; x < 6; x++) {
            if (g_virtualBoard[x][y] != 0) {
                break;
            }
        }
        // No column open and no winners. a draw.
        if (y == undefined) {
            //Display messages and reset layout to on load
            g_$winner.html("Game Over. Game was a draw");
            g_$startStandard.show();
            g_$startHard.show();
            g_$winner.show();
            $('body').css("background-color", "white");
            return;
        }
        g_virtualBoard[x - 1][y] = player;
        return x - 1;
    }

    function availableColumns(g_board) {
        var moves_array = new Array();
        for (var i = 0; i < 7; i++) {
            if (g_board[0][i] === 0) {
                moves_array.push(i);
            }
        }
        return moves_array;
    }

    function AIMove() {
        var defense, attack;
        var block_moves = [];
        var attack_moves = [];
        var bestDefense = 0;
        var bestAttack = 0;

        //Are any columns full?
        var availableMoves = availableColumns(g_virtualBoard);

        //loop through the board to find the available cell in each column
        for (var x = 0; x < availableMoves.length; x++) {
            for (var y = 0; y < 6; y++) {
                //If this cell is not open move on to the next one.
                if (g_virtualBoard[y][availableMoves[x]] != 0) {
                    break;
                }
            }

            //#region gauge best block

            //if player moved to the cell above.
            g_virtualBoard[y - 1][availableMoves[x]] = 1;

            //check behind and in front
            defense = Helper.AdjacentCell(y - 1, availableMoves[x], 0, -1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], 0, 1, g_virtualBoard);

            //check above and below
            defense = Math.max(defense, Helper.AdjacentCell(y - 1, availableMoves[x], -1, 0, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], 1, 0, g_virtualBoard));

            //check lower right and upper left
            defense = Math.max(defense, Helper.AdjacentCell(y - 1, availableMoves[x], 1, 1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], -1, -1, g_virtualBoard));

            //check lower left and upper right
            defense = Math.max(defense, Helper.AdjacentCell(y - 1, availableMoves[x], 1, -1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], -1, 1, g_virtualBoard));

            //If this block matches existing ones add it to the array of possible best options.
            if (bestDefense === defense) {
                block_moves.push(availableMoves[x]);
            }

            //If this is the best block yet clear the moves array and put it at the front.
            if (bestDefense < defense) {
                bestDefense = defense;
                block_moves = [];
                block_moves.push(availableMoves[x]);
            }

            //#endregion gauge best block

            //#region gauge best attack

            //if player moved to the cell above.
            g_virtualBoard[y - 1][availableMoves[x]] = 2;

            //check behind and in front
            attack = Helper.AdjacentCell(y - 1, availableMoves[x], 0, -1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], 0, 1, g_virtualBoard);

            //check above and below
            attack = Math.max(attack, Helper.AdjacentCell(y - 1, availableMoves[x], -1, 0, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], 1, 0, g_virtualBoard));

            //check lower right and upper left
            attack = Math.max(attack, Helper.AdjacentCell(y - 1, availableMoves[x], 1, 1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], -1, -1, g_virtualBoard));

            //check lower left and upper right
            attack = Math.max(attack, Helper.AdjacentCell(y - 1, availableMoves[x], 1, -1, g_virtualBoard)
                + Helper.AdjacentCell(y - 1, availableMoves[x], -1, 1, g_virtualBoard));

            //If this attack matches existing ones add it to the array of possible best options.
            if (bestAttack === attack) {
                attack_moves.push(availableMoves[x]);
            }

            //If this is the best attack yet clear the moves array and put it at the front.
            if (bestAttack < attack) {
                bestAttack = attack;
                attack_moves = [];
                attack_moves.push(availableMoves[x]);
            }
            //Clear the potential player move
            g_virtualBoard[y - 1][availableMoves[x]] = 0;

            //#endregion gauge best attack
        }

        //No mercy!
        if (g_easyMode === false) {
            //attack = 3 means I win
            if (bestAttack === 3) {
                return attack_moves;
            }
                //defense = 3 means I have to block this move or I lose
            else if (bestDefense === 3) {
                return block_moves;
            }
                //favor attack
            else if (bestAttack > bestDefense || bestAttack === bestDefense) {
                return attack_moves;
            }
            return block_moves;
        }

            //favor block
        else if (bestDefense >= bestAttack) {
            return block_moves;
        }
        return attack_moves;
    }

    function validateIsWinningMove() {
        //Has the current player won?
        if (hasWon(g_currRow, g_currColumn)) {
            var winner = g_thisPlayer === 2 ? 'Computer' : 'Player';
            //Display messages
            if (g_easyMode === false && winner === 'Computer') {
                g_$winner.html("Game Over. " + winner + " crushed you!");
            }
            else if (g_easyMode === false && winner === 'Player') {
                g_$winner.html("Game Over. " + winner + " won the game. Good job!");
            } else {
                g_$winner.html("Game Over. " + winner + " won the game.");
            }
            //Reset layout to on load
            g_$startStandard.show();
            g_$startHard.show();
            $('body').css("background-color", "white");
            g_$winner.show();
        } else {
            //Switch players
            if (g_thisPlayer === 2) {
                g_thisPlayer = 1;
            } else {
                g_thisPlayer = 2;
            }
            //other player's turn
            blockPlacement(g_thisPlayer);
        }
    }

    function hasWon(row, column) {
        //first check behind and in front
        if (Helper.AdjacentCell(row, column, 0, -1, g_virtualBoard) + Helper.AdjacentCell(row, column, 0, 1, g_virtualBoard) > 2) {
            return true;
        }
            //check below
        else if (Helper.AdjacentCell(row, column, 1, 0, g_virtualBoard) > 2) {
            return true;
        }
            //check above and upper right
        else if (Helper.AdjacentCell(row, column, -1, 1, g_virtualBoard) + Helper.AdjacentCell(row, column, 1, -1, g_virtualBoard) > 2) {
            return true;
        }
            //check lower right and upper left
        else if (Helper.AdjacentCell(row, column, 1, 1, g_virtualBoard) + Helper.AdjacentCell(row, column, -1, -1, g_virtualBoard) > 2) {
            return true;
        }
        return false;
    }

    //#region customObject

    function blockObject(player) {
        this.player = player;
        this.id = id.toString();
        var $this = this;
        var thisID = this.id;
        this.color = 'blue';
        if (player === 2) {
            this.color = 'red';
        }

        id += 1;

        g_board.onclick = function (evt) {
            //Ignores input while the computer is moving. Prevents getting  free moves from rapid clicks
            if (g_thisPlayer === 1) {
                // Get the horizontal coordinate
                var mouse_x = evt.clientX;

                g_currColumn = Math.floor((mouse_x - g_board.offsetLeft) / 62);
                if (g_currColumn > 6 || g_currColumn < 0) {
                    return;
                }
                else if (availableColumns(g_virtualBoard).indexOf(g_currColumn) != -1) {
                    g_currColumn = Math.floor((evt.clientX - g_board.offsetLeft) / 62);

                    $('#d' + thisID)[0].style.left = (14 + 62 * g_currColumn) + "px";
                    $('#d' + thisID)[0].style.top = "-55px";
                    setBlock($this.id, $this.player);
                }
            }
        }
    }
    //#endregion customObject

    function block_Add(block) {
        g_board.innerHTML += '<div id="d' + block.id + '" class="block ' + block.color + '"></div>';
        if (g_thisPlayer === 2) {
            var bestColumnToMoveTo = AIMove();

            if (g_easyMode === false) {
                //Hard: Always use the best move
                var computerMove = 0;
            } else {
                //Easy: Pick move at random
                var computerMove = Math.floor(Math.random() * bestColumnToMoveTo.length);
            }
            g_currColumn = bestColumnToMoveTo[computerMove];
            $('#d' + block.id)[0].style.left = (14 + 62 * g_currColumn) + "px";
            setBlock(block.id, g_thisPlayer);
        }
    }

    function blockPlacement(player) {
        g_thisPlayer = player;
        var block = new blockObject(player);
        block_Add(block);
    }

    function setBlock(thisID, player) {
        //Set the positon of the player's block
        g_currRow = setAtRow(g_currColumn, player);
        $('#d' + thisID)[0].style.top = (14 + g_currRow * 60) + 'px';

        validateIsWinningMove();
    }
})(jQuery, Game.Struct.Helper);