// FloatingSettingsPanel.js
import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';




const FloatingSettingsPanel = ({ settings, setSettings, onRestart, moves }) => {
  const [isVisible, setIsVisible] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 50 })).current;

  // 顏色選項定義
  const BG_COLORS = ['#999', '#b8b8b8', '#888', '#aaa'];
  const CARD_BACKS = ['#34495e', '#675174ff', '#415563ff', '#4d5f44ff'];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  if (!isVisible) return (
    <TouchableOpacity style={styles.trigger} onPress={() => setIsVisible(true)}><Text style={{fontSize: 24}}>⚙️</Text></TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}>
      <View {...panResponder.panHandlers} style={styles.header}>
        <Text style={styles.headerTitle}>控制面板 (步數: {moves})</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}><Text style={{fontSize: 20}}>×</Text></TouchableOpacity>
      </View>
      <View style={styles.body}>
      {/* 整體縮放搖桿 */}
        <Text style={styles.label}>棋盤整體縮放: {(settings.boardSizeScale * 100).toFixed(0)}%</Text>
        <Slider
          style={{width: '100%', height: 40}}
          minimumValue={0.5}
          maximumValue={1.2}
          value={settings.boardSizeScale}
          onValueChange={(v) => setSettings({...settings, boardSizeScale: v})}
          minimumTrackTintColor="#27ae60"
          maximumTrackTintColor="#000000"
        />

        {/* 寬高比例調整 (影響 boardWidth) */}
        <Text style={styles.label}>佈局寬度微調: {settings.boardAspect.toFixed(2)}</Text>
        <Slider
          style={{width: '100%', height: 40}}
          minimumValue={1.0}
          maximumValue={2.5}
          value={settings.boardAspect}
          onValueChange={(v) => setSettings({...settings, boardAspect: v})}
          minimumTrackTintColor="#2980b9"
          maximumTrackTintColor="#000000"
        />
        <Text style={styles.label}>背景顏色選擇:</Text>
        <View style={styles.colorRow}>
          {BG_COLORS.map(c => (
            <TouchableOpacity key={c} style={[styles.colorBox, {backgroundColor: c, borderWidth: settings.bgColor === c ? 2 : 0}]} 
              onPress={() => setSettings({...settings, bgColor: c})} />
          ))}
        </View>

        <Text style={styles.label}>卡背顏色選擇:</Text>
        <View style={styles.colorRow}>
          {CARD_BACKS.map(c => (
            <TouchableOpacity key={c} style={[styles.colorBox, {backgroundColor: c, borderWidth: settings.cardBack === c ? 2 : 0}]} 
              onPress={() => setSettings({...settings, cardBack: c})} />
          ))}
        </View>

        <Text style={styles.label}>難度設定:</Text>
        <Picker selectedValue={settings.difficulty} onValueChange={(v) => setSettings({...settings, difficulty: v})}>
          {[12, 16, 20, 24].map(n => <Picker.Item key={n} label={`${n} 張`} value={n} />)}
        </Picker>

        <TouchableOpacity style={styles.restartBtn} onPress={onRestart}><Text style={styles.restartText}>重置遊戲</Text></TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  trigger: { position: 'absolute', top: 40, right: 20, width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  panel: { position: 'absolute', width: 250, backgroundColor: '#fff', borderRadius: 12, elevation: 10, shadowOpacity: 0.3, zIndex: 1001 },
  header: { padding: 10, backgroundColor: '#f1f1f1', flexDirection: 'row', justifyContent: 'space-between', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  headerTitle: { fontWeight: 'bold', fontSize: 12 },
  body: { padding: 15 },
  label: { fontSize: 11, color: '#666', marginTop: 10, marginBottom: 5 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorBox: { width: 35, height: 35, borderRadius: 5, borderColor: '#fff', backgroundColor: '#f1f1f1' },
  restartBtn: { marginTop: 20, backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center' },
  restartText: { color: '#fff', fontWeight: 'bold' }
});

export default FloatingSettingsPanel;