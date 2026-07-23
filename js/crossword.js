(function () {
  const puzzle = window.MBC_PUZZLE;
  const board = document.getElementById('crossword-board');
  const acrossList = document.getElementById('clues-across');
  const downList = document.getElementById('clues-down');
  const statusEl = document.getElementById('crossword-status');
  const checkBtn = document.getElementById('crossword-check');
  const revealBtn = document.getElementById('crossword-reveal');
  const clearBtn = document.getElementById('crossword-clear');

  if (!board || !puzzle) return;

  const { width, height, placements, entries } = puzzle;
  const cells = Array.from({ length: height }, () => Array(width).fill(null));
  const solution = Array.from({ length: height }, () => Array(width).fill(null));
  const numbers = Array.from({ length: height }, () => Array(width).fill(0));
  const entryByCell = Array.from({ length: height }, () => Array(width).fill(null));

  function key(row, col) {
    return row + ',' + col;
  }

  placements.forEach((placement) => {
    const entry = entries.find((item) => item.id === placement.entryId);
    if (!entry) return;

    const letters = entry.answer.split('');
    letters.forEach((letter, index) => {
      const row = placement.direction === 'across' ? placement.row : placement.row + index;
      const col = placement.direction === 'across' ? placement.col + index : placement.col;
      solution[row][col] = letter;
      entryByCell[row][col] = entry.id;
    });
  });

  let clueNumber = 1;
  placements.forEach((placement) => {
    const { row, col } = placement;
    if (!numbers[row][col]) {
      numbers[row][col] = clueNumber++;
    }
  });

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (!solution[row][col]) {
        cells[row][col] = { type: 'block' };
        continue;
      }

      cells[row][col] = {
        type: 'letter',
        row,
        col,
        number: numbers[row][col] || '',
        entryId: entryByCell[row][col],
      };
    }
  }

  function renderBoard() {
    board.style.gridTemplateColumns = `repeat(${width}, minmax(1.6rem, 2.25rem))`;
    board.innerHTML = '';

    cells.forEach((rowCells) => {
      rowCells.forEach((cell) => {
        const el = document.createElement('div');
        el.className = 'puzzle-cell';

        if (cell.type === 'block') {
          el.classList.add('puzzle-cell-block');
          board.appendChild(el);
          return;
        }

        el.classList.add('puzzle-cell-input');
        if (cell.number) {
          const num = document.createElement('span');
          num.className = 'puzzle-cell-number';
          num.textContent = cell.number;
          el.appendChild(num);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.autocapitalize = 'characters';
        input.spellcheck = false;
        input.dataset.row = cell.row;
        input.dataset.col = cell.col;
        input.dataset.entry = cell.entryId;
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', onKeyDown);
        input.addEventListener('focus', () => highlightEntry(cell.entryId, true));
        input.addEventListener('blur', () => highlightEntry(cell.entryId, false));
        el.appendChild(input);
        board.appendChild(el);
      });
    });
  }

  function renderClues() {
    const across = entries.filter((entry) => entry.direction === 'across');
    const down = entries.filter((entry) => entry.direction === 'down');

    acrossList.innerHTML = across
      .map((entry) => `<li><button type="button" data-entry="${entry.id}"><strong>${entry.id}.</strong> ${entry.clue}</button></li>`)
      .join('');

    downList.innerHTML = down.length
      ? down.map((entry) => `<li><button type="button" data-entry="${entry.id}"><strong>${entry.id}.</strong> ${entry.clue}</button></li>`).join('')
      : '<li class="puzzle-clue-empty">No down clues in this edition.</li>';

    document.querySelectorAll('.puzzle-clues button[data-entry]').forEach((button) => {
      button.addEventListener('click', () => focusEntry(Number(button.dataset.entry)));
    });
  }

  function focusEntry(entryId) {
    const input = board.querySelector(`input[data-entry="${entryId}"]`);
    if (input) input.focus();
  }

  function highlightEntry(entryId, active) {
    board.querySelectorAll(`input[data-entry="${entryId}"]`).forEach((input) => {
      input.parentElement.classList.toggle('is-active', active);
    });
  }

  function onInput(event) {
    const input = event.target;
    input.value = input.value.replace(/[^a-z]/gi, '').toUpperCase();
    if (!input.value) return;

    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const entryId = Number(input.dataset.entry);
    const placement = placements.find((item) => item.entryId === entryId);
    if (!placement) return;

    let nextRow = row;
    let nextCol = col;
    if (placement.direction === 'across') nextCol += 1;
    else nextRow += 1;

    const next = board.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (next) next.focus();
  }

  function onKeyDown(event) {
    const input = event.target;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const entryId = Number(input.dataset.entry);
    const placement = placements.find((item) => item.entryId === entryId);
    if (!placement) return;

    let nextRow = row;
    let nextCol = col;

    if (event.key === 'Backspace' && !input.value) {
      if (placement.direction === 'across') nextCol -= 1;
      else nextRow -= 1;
    } else if (event.key === 'ArrowRight') nextCol += 1;
    else if (event.key === 'ArrowLeft') nextCol -= 1;
    else if (event.key === 'ArrowDown') nextRow += 1;
    else if (event.key === 'ArrowUp') nextRow -= 1;
    else return;

    event.preventDefault();
    const next = board.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);
    if (next) next.focus();
  }

  function forEachInput(callback) {
    board.querySelectorAll('input').forEach(callback);
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'puzzle-status' + (type ? ` puzzle-status-${type}` : '');
  }

  function checkPuzzle() {
    let filled = 0;
    let correct = 0;

    forEachInput((input) => {
      const row = Number(input.dataset.row);
      const col = Number(input.dataset.col);
      const expected = solution[row][col];
      input.parentElement.classList.remove('is-correct', 'is-wrong');

      if (!input.value) return;
      filled += 1;
      if (input.value === expected) {
        correct += 1;
        input.parentElement.classList.add('is-correct');
      } else {
        input.parentElement.classList.add('is-wrong');
      }
    });

    const total = board.querySelectorAll('input').length;
    if (correct === total) {
      setStatus('Solved! Every answer matches — nice work.', 'success');
      return;
    }

    if (!filled) {
      setStatus('Fill in the grid, then check your answers.', 'info');
      return;
    }

    setStatus(`${correct} of ${total} letters correct. Keep at it.`, 'info');
  }

  function revealPuzzle() {
    forEachInput((input) => {
      const row = Number(input.dataset.row);
      const col = Number(input.dataset.col);
      input.value = solution[row][col];
      input.parentElement.classList.remove('is-wrong');
      input.parentElement.classList.add('is-correct');
    });
    setStatus('Answers revealed for this puzzle.', 'success');
  }

  function clearPuzzle() {
    forEachInput((input) => {
      input.value = '';
      input.parentElement.classList.remove('is-correct', 'is-wrong', 'is-active');
    });
    setStatus('Grid cleared.', 'info');
  }

  checkBtn.addEventListener('click', checkPuzzle);
  revealBtn.addEventListener('click', revealPuzzle);
  clearBtn.addEventListener('click', clearPuzzle);

  renderBoard();
  renderClues();
  setStatus('All clues match the word search edition — same answers, different format.', 'info');
})();
