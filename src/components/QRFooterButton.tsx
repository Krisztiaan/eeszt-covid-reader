import React from 'react';

import Ionicons from '@expo/vector-icons/build/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet } from 'react-native';
// @ts-expect-error
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

const shouldUseHaptics = Platform.OS === 'ios';

function onPressHaptics() {
  if (shouldUseHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

const size = 64;
const slop = 40;

const hitSlop = { top: slop, bottom: slop, right: slop, left: slop };

type QRFooterButtonProps = {
  onPress: () => void;
  isActive?: boolean;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconSize?: number;
};

export default function QRFooterButton({
  onPress,
  isActive = false,
  iconName,
  iconSize = 36,
}: QRFooterButtonProps) {
  return (
    <TouchableBounce
      hitSlop={hitSlop}
      onPressIn={onPressHaptics}
      onPressOut={onPressHaptics}
      onPress={onPress}
    >
      <BlurView intensity={100} style={styles.container} tint={isActive ? 'default' : 'dark'}>
        <Ionicons name={iconName} size={iconSize} color={isActive ? '#4e9bde' : '#ffffff'} />
      </BlurView>
    </TouchableBounce>
  );
}

const styles = StyleSheet.create({
  container: {
    width: size,
    height: size,
    overflow: 'hidden',
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
