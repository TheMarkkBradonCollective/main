(function () {
  const puzzle = window.MARKKADE_PUZZLE;
  const board = document.getElementById('wordsearch-board');
  const wordList = document.getElementById('wordsearch-words');
  const statusEl = document.getElementById('wordsearch-status');
  const resetBtn = document.getElementById('wordsearch-reset');

  if (!board || !puzzle?.wordSearch) return;

  const size = puzzle.wordSearch.size;
  const words = puzzle.wordSearch.words.map((item) => ({
    word: item.word.toUpperCase(),
    clue: item.clue,
    found: false,
  }));

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, -1],
  ];

  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placements = [];

  function canPlace(word, row, col, dr, dc) {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      const existing = grid[r][c];
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  function placeWord(word) {
    const options = [];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        directions.forEach(([dr, dc]) => {
          if (canPlace(word, row, col, dr, dc)) {
            options.push({ row, col, dr, dc });
          }
        });
      }
    }

    if (!options.length) return false;

    const choice = options[Math.floor(Math.random() * options.length)];
    const cells = [];

    for (let i = 0; i < word.length; i += 1) {
      const r = choice.row + choice.dr * i;
      const c = choice.col + choice.dc * i;
      grid[r][c] = word[i];
      cells.push({ row: r, col: c });
    }

    placements.push({ word, cells });
    return true;
  }

  words
    .slice()
    .sort((a, b) => b.word.length - a.word.length)
    .forEach((item) => {
      if (!placeWord(item.word)) {
        throw new Error(`Unable to place word: ${item.word}`);
      }
    });

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  let selectionStart = null;
  let selectionCells = [];

  function renderBoard() {
    board.style.gridTemplateColumns = `repeat(${size}, minmax(1.35rem, 1.9rem))`;
    board.innerHTML = '';

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'puzzle-cell puzzle-cell-letter';
        button.textContent = grid[row][col];
        button.dataset.row = row;
        button.dataset.col = col;
        button.addEventListener('click', () => onCellClick(row, col));
        board.appendChild(button);
      }
    }
  }

  function renderWordList() {
    wordList.innerHTML = words
      .map(
        (item, index) =>
          `<li class="${item.found ? 'is-found' : ''}" data-index="${index}"><strong>${item.clue}</strong><span>${item.word.length} letters</span></li>`
      )
      .join('');
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'puzzle-status' + (type ? ` puzzle-status-${type}` : '');
  }

  function clearSelection() {
    selectionStart = null;
    selectionCells = [];
    board.querySelectorAll('.is-selecting, .is-found-cell').forEach((cell) => {
      if (!cell.classList.contains('is-found-cell')) {
        cell.classList.remove('is-selecting');
      }
    });
  }

  function lineCells(start, end) {
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (!steps) return [start];

    const rowStep = dr === 0 ? 0 : dr / steps;
    const colStep = dc === 0 ? 0 : dc / steps;
    const cells = [];

    for (let i = 0; i <= steps; i += 1) {
      cells.push({
        row: start.row + rowStep * i,
        col: start.col + colStep * i,
      });
    }

    return cells;
  }

  function onCellClick(row, col) {
    const cell = { row, col };

    if (!selectionStart) {
      selectionStart = cell;
      selectionCells = [cell];
      board.querySelectorAll('.puzzle-cell-letter').forEach((button) => button.classList.remove('is-selecting'));
      board.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('is-selecting');
      return;
    }

    const cells = lineCells(selectionStart, cell);
    if (!cells) {
      selectionStart = cell;
      selectionCells = [cell];
      board.querySelectorAll('.puzzle-cell-letter').forEach((button) => button.classList.remove('is-selecting'));
      board.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('is-selecting');
      return;
    }

    selectionCells = cells;
    board.querySelectorAll('.puzzle-cell-letter').forEach((button) => button.classList.remove('is-selecting'));
    cells.forEach((item) => {
      board.querySelector(`[data-row="${item.row}"][data-col="${item.col}"]`).classList.add('is-selecting');
    });

    const selectedWord = cells
      .map((item) => grid[item.row][item.col])
      .join('');
    const reversed = selectedWord.split('').reverse().join('');
    const match = placements.find(
      (placement) =>
        !words.find((item) => item.word === placement.word)?.found &&
        (placement.word === selectedWord || placement.word === reversed)
    );

    if (match) {
      const wordItem = words.find((item) => item.word === match.word);
      wordItem.found = true;
      cells.forEach((item) => {
        board.querySelector(`[data-row="${item.row}"][data-col="${item.col}"]`).classList.add('is-found-cell');
      });
      renderWordList();

      if (words.every((item) => item.found)) {
        setStatus('All words found! Same answers as the crossword edition.', 'success');
      } else {
        setStatus(`Found "${match.word}". ${words.filter((item) => item.found).length} of ${words.length} complete.`, 'success');
      }
    } else {
      setStatus('That selection is not one of the puzzle words. Try again.', 'info');
    }

    clearSelection();
  }

  function resetPuzzle() {
    words.forEach((item) => {
      item.found = false;
    });
    board.querySelectorAll('.is-found-cell, .is-selecting').forEach((cell) => {
      cell.classList.remove('is-found-cell', 'is-selecting');
    });
    renderWordList();
    setStatus('Word list reset. Clues match the crossword puzzle.', 'info');
  }

  resetBtn.addEventListener('click', resetPuzzle);
  renderBoard();
  renderWordList();
  setStatus('Tap the first and last letter of a word. Clues match the crossword.', 'info');
})();
