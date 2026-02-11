// utils.js

/**
 * 質因數分解佈局：尋找最接近正方形的比例
 * 確保 16 -> 4x4, 20 -> 5x4, 18 -> 6x3, 24 -> 6x4
 */
export const getOptimalLayout = (total) => {
  // 從總數的平方根開始往回找，找到第一個能整除的數作為「高度」
  let rows = Math.floor(Math.sqrt(total));
  while (total % rows !== 0) {
    rows--;
  }
  let cols = total / rows;

  // 確保較大者為寬 (cols)，較小者為高 (rows)，更符合螢幕比例
  return {
    cols: Math.max(cols, rows),
    rows: Math.min(cols, rows)
  };
};

export const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};