window.MBC_PUZZLE = {
  entries: [
    { id: 1, direction: 'across', clue: 'Favorite color', answer: 'GREEN' },
    { id: 2, direction: 'across', clue: 'Favorite thing to drink', answer: 'TEA' },
    { id: 3, direction: 'across', clue: 'Favorite thing to eat', answer: 'BURGER' },
    { id: 4, direction: 'across', clue: 'Favorite car', answer: 'MUSTANG' },
  ],
  width: 10,
  height: 8,
  placements: [
    { entryId: 1, row: 0, col: 2, direction: 'across' },
    { entryId: 2, row: 2, col: 0, direction: 'across' },
    { entryId: 3, row: 4, col: 2, direction: 'across' },
    { entryId: 4, row: 6, col: 0, direction: 'across' },
  ],
  wordSearch: {
    size: 12,
    words: [
      { word: 'GREEN', clue: 'Favorite color' },
      { word: 'BURGER', clue: 'Favorite thing to eat' },
      { word: 'TEA', clue: 'Favorite thing to drink' },
      { word: 'MUSTANG', clue: 'Favorite car' },
      { word: 'COLLECTIVE', clue: 'This collective' },
      { word: 'PHOTO', clue: 'Pictures section' },
      { word: 'COMICS', clue: 'Strips & panels' },
      { word: 'LUA', clue: 'StickzCoder language' },
    ],
  },
};
