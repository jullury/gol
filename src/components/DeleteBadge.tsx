import { View, Text } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

export default function DeleteBadge() {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Deleted</Text>
    </View>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  badge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  text: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
