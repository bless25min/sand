export const createGameGenomeThemeFixture = () => ({
  title: '黑潮檔案庫',
  premise: '一座會改寫訪客記憶的沉沒檔案庫。',
  aliases: {
    PROGRESS: '解密',
    INTEGRITY: '記憶',
    INSTABILITY: '侵蝕',
    CREDITS: '殘頁',
  },
  winDescription: '解開七層封印。',
  failDescription: '記憶耗盡或侵蝕失控。',
  modules: Array.from({ length: 12 }, (_, index) => ({
    name: `檔案模組 ${index + 1}`,
    description: `第 ${index + 1} 種檔案庫異象。`,
  })),
  threats: Array.from({ length: 7 }, (_, index) => ({
    name: `守密者 ${index + 1}`,
    telegraph: `第 ${index + 1} 層封印正在閉合。`,
  })),
  counters: ['封存解密', '截斷共鳴', '污染轉譯'],
  endings: {
    victory: { title: '檔案解封', description: '沉沒的真相重新浮出水面。' },
    defeat: { title: '記憶封存', description: '你的名字成為下一份失落檔案。' },
  },
});
