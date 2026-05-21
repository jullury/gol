import { View, Text, StyleSheet } from 'react-native';

export default function DeleteBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Deleted</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
