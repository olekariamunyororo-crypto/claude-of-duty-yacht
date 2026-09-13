import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { addLook, input, queueGrenade, queueJump, queueReload } from './InputManager';
import { makeTapDetector } from './Gestures';

const STICK_R = 52;
export function TouchControls() {
  const knob = useMemo(() => ({ x: 0, y: 0 }), []);
  const lookRef = useRef({ tracking: false, x: 0, y: 0 });
  const doubleTapJump = useMemo(() => makeTapDetector(queueJump), []);
  const stickTap = useMemo(() => makeTapDetector(() => { input.sprintLock = !input.sprintLock; }), []);

  const stickPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => stickTap.tap(),
        onPanResponderMove: (_e, g) => {
          const len = Math.hypot(g.dx, g.dy);
          const cl = len > STICK_R ? STICK_R / len : 1;
          input.moveX = (g.dx * cl) / STICK_R;
          input.moveY = (-g.dy * cl) / STICK_R;
          knob.x = g.dx * cl; knob.y = g.dy * cl;
        },
        onPanResponderRelease: () => { input.moveX = 0; input.moveY = 0; knob.x = 0; knob.y = 0; },
      }),
    [knob, stickTap],
  );

  const lookPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          lookRef.current = { tracking: true, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
          doubleTapJump.tap();
        },
        onPanResponderMove: (e) => {
          const { pageX, pageY } = e.nativeEvent;
          if (lookRef.current.tracking) addLook(pageX - lookRef.current.x, pageY - lookRef.current.y);
          lookRef.current.x = pageX; lookRef.current.y = pageY;
        },
        onPanResponderRelease: () => { lookRef.current.tracking = false; },
      }),
    [doubleTapJump],
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-only" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '58%' }} {...lookPan.panHandlers} />
      <View {...stickPan.panHandlers} style={styles.stickBase}>
        <View style={[styles.stickKnob, { transform: [{ translateX: knob.x }, { translateY: knob.y }] }]} />
      </View>
      <View pointerEvents="box-none" style={{ position: 'absolute', right: 18, bottom: 18, alignItems: 'flex-end' }}>
        <Pressable onPressIn={() => { input.fire = true; }} onPressOut={() => { input.fire = false; }} style={styles.fireBtn}>
          <Text style={styles.btnText}>FIRE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickBase: { position: 'absolute', left: 26, bottom: 26, width: STICK_R * 2, height: STICK_R * 2, borderRadius: STICK_R, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stickKnob: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.35)' },
  fireBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,70,40,0.6)', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
