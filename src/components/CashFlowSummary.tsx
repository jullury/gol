import { View, Text } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

interface CashFlowSummaryProps {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  passengerCount: number;
  activePassengerCount: number;
}

export default function CashFlowSummary({
  totalCashIn,
  totalCashOut,
  netCashFlow,
  passengerCount,
  activePassengerCount,
}: CashFlowSummaryProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cash Flow</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Passengers</Text>
        <Text style={styles.value}>{passengerCount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>On Board</Text>
        <Text style={styles.value}>{activePassengerCount}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.label}>Money In</Text>
        <Text style={[styles.cashIn, { color: colors.success }]}>
          {totalCashIn.toLocaleString()} Ar
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Money Out</Text>
        <Text style={[styles.cashOut, { color: colors.danger }]}>
          {totalCashOut.toLocaleString()} Ar
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.netLabel}>Net Cash Flow</Text>
        <Text
          style={[styles.netValue, { color: netCashFlow >= 0 ? colors.success : colors.danger }]}
        >
          {netCashFlow >= 0 ? '+' : ''}
          {netCashFlow.toLocaleString()} Ar
        </Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: colors.text.muted,
  },
  value: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  cashIn: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  cashOut: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  netValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
