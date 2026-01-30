import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform, useWindowDimensions, Animated } from 'react-native';
import FloatingSettingsPanel from './FloatingSettingsPanel';
import { getOptimalLayout, shuffle } from './utils';

const ALL_ICONS = ['🍎','🍌','🍇','🍓','🍒','🍍','🥝','🍉','🍐','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐙','🦑','🦞','🦀','🐠','🐟','🐬','🌈','🔥','⭐','🍀'];

const Card = ({ card, index, onPress, isOpen, isMatched, isSuccess, settings, layout }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity 
      disabled={isMatched}
      onPress={() => onPress(index)}
      style={[styles.cardContainer, { width: layout.cardW, height: layout.cardH, opacity: isMatched ? settings.matchedOpacity : 1 }]}
    >
      <Animated.View style={[styles.cardSide, { backgroundColor: settings.cardBack, transform: [{ rotateY: frontInterpolate }] }]} />
      
      <Animated.View style={[
        styles.cardSide, 
        styles.cardFront, 
        isSuccess && { backgroundColor: '#27ae60', elevation: 15, shadowColor: '#2ecc71', shadowOpacity: 0.8, shadowRadius: 10 },
        { transform: [{ rotateY: backInterpolate }] }
      ]}>
        <Text style={[styles.cardIcon, { fontSize: layout.cardH * 0.5, color: isSuccess ? '#fff' : '#000' }]}>
          {!isMatched ? card.symbol : ""} 
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function App() {
  const matchTimeoutRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const [successPair, setSuccessPair] = useState([]);
  const [settings, setSettings] = useState({ 
  bgColor: '#2c3e50', 
  cardBack: '#34495e', 
  matchedOpacity: 0.2, 
  difficulty: 12,
  boardSizeScale: 1.0, // 新增：整體縮放倍率
  boardAspect: 1.618   // 新增：棋盤寬高比
});
  const [cards, setCards] = useState([]);
  const [openedCards, setOpenedCards] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [turnCounts, setTurnCounts] = useState({});
  const [overlay, setOverlay] = useState({ show: false, title: "", msg: "", success: false });
// 2. 修改 layoutInfo 邏輯
// App.js 內部的 layoutInfo 修改
const layoutInfo = useMemo(() => {
  const { cols, rows } = getOptimalLayout(settings.difficulty);
  const gap = 10;
  
  // 1. 偵測方向：如果高 > 寬，強制使用 1:1.1 比例 (寬度略大於高度)
  // 否則使用 settings 內的搖桿設定值
  const currentAspect = height > width ? 1 / 1.1 : settings.boardAspect;

  const baseWidth = (width - 40) * settings.boardSizeScale; 
  const availH = (height - 150) * settings.boardSizeScale;

  // 2. 根據新的比例計算卡片尺寸
  const cardW = Math.min(baseWidth / cols - gap, (availH / rows - gap) * currentAspect);
  const cardH = cardW / 1.618; // 卡片本身維持橫式黃金比例

  const boardWidth = (cardW + gap) * cols;

  return { cols, rows, cardW, cardH, boardWidth };
}, [settings.difficulty, settings.boardSizeScale, settings.boardAspect, width, height]);

  const initGame = useCallback(() => {
    const icons = shuffle(ALL_ICONS).slice(0, settings.difficulty / 2);
    const deck = shuffle([...icons, ...icons]).map((s, i) => ({ id: i, symbol: s }));
    setCards(deck);
    setMatchedIndices([]);
    setOpenedCards([]);
    setMoves(0);
    setTurnCounts({});
    setOverlay({ show: false, title: "", msg: "", success: false });
    setSuccessPair([]);
    if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
  }, [settings.difficulty]);

  useEffect(() => { initGame(); }, [initGame]);

  const gameOver = (message) => {
    setOverlay({ show: true, title: "GAME OVER", msg: message, success: false });
  };

  const checkWin = (currentMatched) => {
    if (currentMatched.length === settings.difficulty) {
      setOverlay({ show: true, title: "SUCCESS!", msg: "恭喜！你完美的記住了所有位置。", success: true });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (overlay.show && e.key === 'Enter') initGame(); };
    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [overlay.show, initGame]);

  const handlePress = (idx) => {
    if (matchedIndices.includes(idx) || openedCards.includes(idx) || overlay.show) return;

    // --- 重點修正：點擊第三張牌時的處理 ---
    if (openedCards.length === 2) {
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
        matchTimeoutRef.current = null;
      }

      const [i1, i2] = openedCards;
      // 如果前兩張是正確配對，立刻「結算」它們，不讓它們因為點擊第三張而消失
      if (cards[i1].symbol === cards[i2].symbol) {
        const newMatched = [...matchedIndices, i1, i2];
        setMatchedIndices(newMatched);
        checkWin(newMatched);
      }
      
      setOpenedCards([idx]);
      setSuccessPair([]); // 清除閃爍
      return;
    }

    const count = (turnCounts[idx] || 0) + 1;
    setTurnCounts({ ...turnCounts, [idx]: count });
    
    if (count > 2) {
      gameOver(`這張牌翻過 ${count - 1} 次了，竟然還沒成功！`);
      return;
    }

    const newOpened = [...openedCards, idx];
    setOpenedCards(newOpened);

    if (newOpened.length === 2) {
      setMoves(m => m + 1);
      checkMatch(newOpened);
    }
  };

  const checkMatch = (pair) => {
    const [i1, i2] = pair;
    if (cards[i1].symbol === cards[i2].symbol) {
      setSuccessPair([i1, i2]); // 啟動綠色發光
      
      matchTimeoutRef.current = setTimeout(() => {
        setMatchedIndices(prev => {
          const next = [...prev, i1, i2];
          checkWin(next);
          return next;
        });
        setOpenedCards([]);
        setSuccessPair([]);
        matchTimeoutRef.current = null;
      }, 800);
    } else {
      matchTimeoutRef.current = setTimeout(() => {
        setOpenedCards([]);
        matchTimeoutRef.current = null;
      }, 1200);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: settings.bgColor }]}>
      <View style={[styles.board, { width: layoutInfo.boardWidth }]}>
        {cards.map((card, i) => (
          <Card 
            key={i} 
            card={card} 
            index={i} 
            settings={settings}
            layout={layoutInfo}
            isOpen={openedCards.includes(i) || matchedIndices.includes(i)}
            isMatched={matchedIndices.includes(i)}
            isSuccess={successPair.includes(i)}
            onPress={handlePress}
          />
        ))}
      </View>
      <FloatingSettingsPanel settings={settings} setSettings={setSettings} onRestart={initGame} moves={moves} />
      <Modal visible={overlay.show} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{overlay.title}</Text>
            <Text style={styles.modalMsg}>{overlay.msg}</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: overlay.success ? '#27ae60' : '#e74c3c' }]} onPress={initGame}>
              <Text style={{color:'#fff', fontWeight: 'bold'}}>按 Enter 或點擊重新開始</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  board: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  cardContainer: { margin: 5 },
  cardSide: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 10, elevation: 5, justifyContent: 'center', alignItems: 'center' },
  cardFront: { backgroundColor: '#fff', transform: [{ rotateY: '180deg' }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 40, borderRadius: 20, alignItems: 'center', width: '80%', maxWidth: 400 },
  modalTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  modalMsg: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  btn: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  cardIcon: { textAlign: 'center' }
});